import { create } from 'zustand';
import { Team, Game, TournamentConfig, Conflict } from '../types';
import { generateSchedule, detectConflicts } from '../lib/scheduler';

interface TournamentState {
  teams: Team[];
  games: Game[];
  config: TournamentConfig;
  conflicts: Conflict[];
  
  // Actions
  addTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
  importTeamsFromCSV: (csv: string) => number;
  updateConfig: (config: Partial<TournamentConfig>) => void;
  addGame: (game: Game) => void;
  removeGame: (gameId: string) => void;
  moveGame: (gameId: string, newCourt: number, newTimeSlot: number) => void;
  autoSchedule: () => void;
  checkConflicts: () => void;
  exportToCSV: () => string;
  clearAllTeams: () => void;
  getAgeGroups: () => string[];
  getCities: () => string[];
}

const defaultConfig: TournamentConfig = {
  name: 'Basketball Tournament',
  startDate: new Date().toISOString().split('T')[0],
  days: 2,
  gamesPerTeam: 3,
  gameDuration: 60,
  restPeriod: 30,
  avoidBackToBack: true,
  courts: 4,
  timeSlots: [
    '08:00 AM', '09:30 AM', '11:00 AM', '12:30 PM',
    '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM'
  ],
  groupByAge: true,
  groupByCity: false,
};

// Parse grade level to number for comparison
const parseGrade = (grade: string): number => {
  const match = grade?.toLowerCase().match(/(\d+)(?:st|nd|rd|th)?/);
  return match ? parseInt(match[1]) : 0;
};

export const useTournamentStore = create<TournamentState>((set, get) => ({
  teams: [],
  games: [],
  config: defaultConfig,
  conflicts: [],

  addTeam: (team) => set((state) => ({ 
    teams: [...state.teams, team] 
  })),

  removeTeam: (teamId) => set((state) => ({
    teams: state.teams.filter((t) => t.id !== teamId),
    games: state.games.filter((g) => g.team1Id !== teamId && g.team2Id !== teamId),
  })),

  clearAllTeams: () => set({ teams: [], games: [], conflicts: [] }),

  importTeamsFromCSV: (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Map possible column names
    const findColumn = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
        if (idx !== -1) return idx;
      }
      return -1;
    };
    
    const nameIdx = findColumn(['team name', 'name']);
    const ageGroupIdx = findColumn(['age group', 'age']);
    const gradeIdx = findColumn(['grade level', 'grade']);
    const cityIdx = findColumn(['city', 'location']);
    const winsIdx = findColumn(['wins', 'win']);
    const lossesIdx = findColumn(['losses', 'loss']);
    const teamIdIdx = findColumn(['team id', 'id']);
    
    if (nameIdx === -1) {
      console.error('CSV must have a "Team Name" or "name" column');
      return 0;
    }

    const newTeams: Team[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[nameIdx]) {
        newTeams.push({
          id: crypto.randomUUID(),
          name: values[nameIdx],
          teamId: teamIdIdx !== -1 ? values[teamIdIdx] : undefined,
          ageGroup: ageGroupIdx !== -1 ? values[ageGroupIdx] : undefined,
          gradeLevel: gradeIdx !== -1 ? values[gradeIdx] : undefined,
          city: cityIdx !== -1 ? values[cityIdx] : undefined,
          wins: winsIdx !== -1 ? parseInt(values[winsIdx]) || 0 : undefined,
          losses: lossesIdx !== -1 ? parseInt(values[lossesIdx]) || 0 : undefined,
        });
      }
    }

    set((state) => ({ teams: [...state.teams, ...newTeams] }));
    return newTeams.length;
  },

  getAgeGroups: () => {
    const groups = new Set<string>();
    get().teams.forEach(t => {
      if (t.ageGroup) groups.add(t.ageGroup);
    });
    return Array.from(groups).sort();
  },

  getCities: () => {
    const cities = new Set<string>();
    get().teams.forEach(t => {
      if (t.city) cities.add(t.city);
    });
    return Array.from(cities).sort();
  },

  updateConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),

  addGame: (game) => set((state) => ({
    games: [...state.games, game],
  })),

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
}));
