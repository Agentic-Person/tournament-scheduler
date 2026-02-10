import { create } from 'zustand';
import { Team, Game, TournamentConfig, Conflict } from '../types';
import { generateSchedule, detectConflicts } from '../lib/scheduler';

// Generate Court objects from count
const generateCourts = (count: number): { id: string; name: string }[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `court-${i + 1}`,
    name: `Court ${i + 1}`,
  }));
};

// Generate TimeSlot objects from strings
const generateTimeSlots = (slots: string[], days: number): { id: string; day: number; startTime: string; endTime: string; duration: number }[] => {
  const result: { id: string; day: number; startTime: string; endTime: string; duration: number }[] = [];
  for (let day = 1; day <= days; day++) {
    slots.forEach((time, idx) => {
      result.push({
        id: `day${day}-slot${idx}`,
        day,
        startTime: time,
        endTime: time, // Simplified
        duration: 45,
      });
    });
  }
  return result;
};

interface TournamentState {
  teams: Team[];
  games: Game[];
  config: TournamentConfig;
  conflicts: Conflict[];
  selectedGame: string | null;
  isAutoScheduling: boolean;

  // Computed
  courts: { id: string; name: string }[];
  timeSlots: { id: string; day: number; startTime: string; endTime: string; duration: number }[];

  // Actions
  addTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
  importTeamsFromCSV: (csv: string) => number;
  updateConfig: (config: Partial<TournamentConfig>) => void;
  setConfig: (config: Partial<TournamentConfig>) => void;
  addGame: (game: Game) => void;
  removeGame: (gameId: string) => void;
  moveGame: (gameId: string, newCourt: number, newTimeSlot: number) => void;
  autoSchedule: () => void;
  checkConflicts: () => void;
  clearSchedule: () => void;
  exportScheduleToCSV: () => string;
  exportToCSV: () => string;
  setSelectedGame: (gameId: string | null) => void;
  clearAllTeams: () => void;
  getAgeGroups: () => string[];
  getCities: () => string[];
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  teams: [],
  games: [],
  config: {
    name: 'Basketball Tournament',
    startDate: new Date().toISOString().split('T')[0],
    days: 2,
    gamesPerTeam: 3,
    gameDuration: 45,
    restPeriod: 15,
    avoidBackToBack: true,
    courts: 3,
    timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  conflicts: [],
  selectedGame: null,
  isAutoScheduling: false,

  // Computed getters
  get courts() {
    return generateCourts(get().config.courts);
  },
  get timeSlots() {
    return generateTimeSlots(get().config.timeSlots, get().config.days);
  },

  addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),

  removeTeam: (teamId) => set((state) => ({
    teams: state.teams.filter((t) => t.id !== teamId),
    games: state.games.filter((g) => g.team1Id !== teamId && g.team2Id !== teamId),
  })),

  importTeamsFromCSV: (csv) => {
    const lines = csv.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 2) continue;

      const teamId = values[0]?.trim();
      const name = values[1]?.trim();

      if (!name) continue;

      const team: Team = {
        id: teamId || crypto.randomUUID(),
        name,
        teamId,
      };

      // Try to extract other fields
      const ageGroupIdx = headers.findIndex(h => h.includes('age') || h.includes('group'));
      if (ageGroupIdx >= 0) team.ageGroup = values[ageGroupIdx]?.trim();

      const cityIdx = headers.findIndex(h => h.includes('city'));
      if (cityIdx >= 0) team.city = values[cityIdx]?.trim();

      const winsIdx = headers.findIndex(h => h.includes('win'));
      if (winsIdx >= 0) team.wins = parseInt(values[winsIdx]) || 0;

      const lossesIdx = headers.findIndex(h => h.includes('loss'));
      if (lossesIdx >= 0) team.losses = parseInt(values[lossesIdx]) || 0;

      get().addTeam(team);
      imported++;
    }
    return imported;
  },

  updateConfig: (newConfig) => set((state) => ({ 
    config: { ...state.config, ...newConfig } 
  })),

  setConfig: (newConfig) => set((state) => ({ 
    config: { ...state.config, ...newConfig } 
  })),

  addGame: (game) => set((state) => ({ games: [...state.games, game] })),

  removeGame: (gameId) => set((state) => ({
    games: state.games.filter((g) => g.id !== gameId),
  })),

  moveGame: (gameId, newCourt, newTimeSlot) => set((state) => ({
    games: state.games.map((g) =>
      g.id === gameId ? { ...g, court: newCourt, timeSlot: newTimeSlot } : g
    ),
  })),

  autoSchedule: () => {
    const { teams, config } = get();
    if (teams.length < 2) return;

    const schedule = generateSchedule(teams, config);
    set({ games: schedule });
    get().checkConflicts();
  },

  checkConflicts: () => {
    const { games, config } = get();
    const conflicts = detectConflicts(games, config);
    set({ conflicts });
  },

  clearSchedule: () => set({ games: [], conflicts: [] }),

  clearAllTeams: () => set({ teams: [], games: [], conflicts: [] }),

  exportScheduleToCSV: () => {
    const { games, teams } = get();
    let csv = 'Game ID,Team 1,Team 2,Court,Day,Time Slot\n';
    games.forEach((game) => {
      const team1 = teams.find((t) => t.id === game.team1Id)?.name || 'Unknown';
      const team2 = teams.find((t) => t.id === game.team2Id)?.name || 'Unknown';
      csv += `${game.id},${team1},${team2},${game.court},${game.day},${game.timeSlot}\n`;
    });
    return csv;
  },

  exportToCSV: () => {
    const { games, teams } = get();
    let csv = 'Game ID,Team 1,Team 2,Court,Day,Time Slot\n';
    games.forEach((game) => {
      const team1 = teams.find((t) => t.id === game.team1Id)?.name || 'Unknown';
      const team2 = teams.find((t) => t.id === game.team2Id)?.name || 'Unknown';
      csv += `${game.id},${team1},${team2},${game.court},${game.day},${game.timeSlot}\n`;
    });
    return csv;
  },

  setSelectedGame: (gameId) => set({ selectedGame: gameId }),

  getAgeGroups: () => {
    const groups = new Set<string>();
    get().teams.forEach((t) => { if (t.ageGroup) groups.add(t.ageGroup); });
    return Array.from(groups).sort();
  },

  getCities: () => {
    const cities = new Set<string>();
    get().teams.forEach((t) => { if (t.city) cities.add(t.city); });
    return Array.from(cities).sort();
  },
}));
