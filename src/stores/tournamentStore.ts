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

  importTeamsFromCSV: (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const nameIndex = headers.indexOf('name');
    const tierIndex = headers.indexOf('tier');
    const genderIndex = headers.indexOf('gender');
    
    if (nameIndex === -1) {
      console.error('CSV must have a "name" column');
      return 0;
    }

    const newTeams: Team[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[nameIndex]) {
        newTeams.push({
          id: crypto.randomUUID(),
          name: values[nameIndex],
          tier: (tierIndex !== -1 ? values[tierIndex] : 'novice') as 'novice' | 'intermediate' | 'advanced',
          gender: (genderIndex !== -1 ? values[genderIndex] : 'male') as 'male' | 'female',
        });
      }
    }

    set((state) => ({ teams: [...state.teams, ...newTeams] }));
    return newTeams.length;
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
