import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Court, TimeSlot, Game, TournamentConfig, ScheduleConflict } from '../types';

interface TournamentState {
  // Data
  teams: Team[];
  courts: Court[];
  timeSlots: TimeSlot[];
  games: Game[];
  config: TournamentConfig;
  conflicts: ScheduleConflict[];
  
  // UI State
  selectedTeam: string | null;
  selectedGame: string | null;
  isAutoScheduling: boolean;
  importError: string | null;
  
  // Actions
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  removeTeam: (teamId: string) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  
  setCourts: (courts: Court[]) => void;
  setTimeSlots: (slots: TimeSlot[]) => void;
  setGames: (games: Game[]) => void;
  
  addGame: (game: Game) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
  removeGame: (gameId: string) => void;
  moveGame: (gameId: string, newTimeSlotId: string, newCourtId: string) => void;
  
  setConfig: (config: Partial<TournamentConfig>) => void;
  setConflicts: (conflicts: ScheduleConflict[]) => void;
  
  setSelectedTeam: (teamId: string | null) => void;
  setSelectedGame: (gameId: string | null) => void;
  setIsAutoScheduling: (isScheduling: boolean) => void;
  setImportError: (error: string | null) => void;
  
  // Import/Export
  importTeamsFromCSV: (csvContent: string) => void;
  exportScheduleToCSV: () => string;
  
  // Scheduling
  autoSchedule: () => void;
  validateSchedule: () => ScheduleConflict[];
  clearSchedule: () => void;
}

const defaultConfig: TournamentConfig = {
  name: 'Basketball Tournament',
  startDate: new Date().toISOString().split('T')[0],
  numberOfDays: 2,
  gamesPerTeam: 3,
  courts: [
    { id: 'court-1', name: 'Court A', location: 'Main Gym' },
    { id: 'court-2', name: 'Court B', location: 'Main Gym' },
    { id: 'court-3', name: 'Court C', location: 'Aux Gym' },
  ],
  timeSlots: [],
  gameDuration: 45,
  minRestBetweenGames: 30,
  avoidBackToBack: true,
};

// Generate time slots for 2 days
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  
  for (let day = 1; day <= 2; day++) {
    startTimes.forEach((time) => {
      const [hour, minute] = time.split(':').map(Number);
      const endHour = hour + 1;
      slots.push({
        id: `day${day}-${time}`,
        day,
        startTime: time,
        endTime: `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        duration: 60,
      });
    });
  }
  
  return slots;
};

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      teams: [],
      courts: defaultConfig.courts,
      timeSlots: generateTimeSlots(),
      games: [],
      config: { ...defaultConfig, timeSlots: generateTimeSlots() },
      conflicts: [],
      
      selectedTeam: null,
      selectedGame: null,
      isAutoScheduling: false,
      importError: null,
      
      setTeams: (teams) => set({ teams }),
      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      removeTeam: (teamId) => set((state) => ({ 
        teams: state.teams.filter((t) => t.id !== teamId),
        games: state.games.filter((g) => g.homeTeamId !== teamId && g.awayTeamId !== teamId)
      })),
      updateTeam: (teamId, updates) => set((state) => ({
        teams: state.teams.map((t) => t.id === teamId ? { ...t, ...updates } : t)
      })),
      
      setCourts: (courts) => set({ courts }),
      setTimeSlots: (timeSlots) => set({ timeSlots }),
      setGames: (games) => set({ games }),
      
      addGame: (game) => set((state) => ({ games: [...state.games, game] })),
      updateGame: (gameId, updates) => set((state) => ({
        games: state.games.map((g) => g.id === gameId ? { ...g, ...updates } : g)
      })),
      removeGame: (gameId) => set((state) => ({
        games: state.games.filter((g) => g.id !== gameId)
      })),
      moveGame: (gameId, newTimeSlotId, newCourtId) => set((state) => {
        const timeSlot = state.timeSlots.find((t) => t.id === newTimeSlotId);
        return {
          games: state.games.map((g) => 
            g.id === gameId 
              ? { ...g, timeSlotId: newTimeSlotId, courtId: newCourtId, day: timeSlot?.day || g.day, startTime: timeSlot?.startTime || g.startTime }
              : g
          )
        };
      }),
      
      setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
      setConflicts: (conflicts) => set({ conflicts }),
      
      setSelectedTeam: (teamId) => set({ selectedTeam: teamId }),
      setSelectedGame: (gameId) => set({ selectedGame: gameId }),
      setIsAutoScheduling: (isScheduling) => set({ isAutoScheduling: isScheduling }),
      setImportError: (error) => set({ importError: error }),
      
      importTeamsFromCSV: (csvContent) => {
        try {
          const lines = csvContent.trim().split('\n');
          if (lines.length < 2) {
            set({ importError: 'CSV must have at least a header row and one data row' });
            return;
          }
          
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
          const nameIndex = headers.findIndex(h => h.includes('team') || h.includes('name'));
          const groupIndex = headers.findIndex(h => h.includes('group') || h.includes('division'));
          const coachIndex = headers.findIndex(h => h.includes('coach'));
          
          const newTeams: Team[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length < 1 || !values[0]) continue;
            
            newTeams.push({
              id: `team-${Date.now()}-${i}`,
              name: values[nameIndex >= 0 ? nameIndex : 0] || values[0],
              group: groupIndex >= 0 ? values[groupIndex] : undefined,
              coach: coachIndex >= 0 ? values[coachIndex] : undefined,
              maxGamesPerDay: 2,
              minRestBetweenGames: 30,
            });
          }
          
          set((state) => ({ 
            teams: [...state.teams, ...newTeams],
            importError: null 
          }));
        } catch (error) {
          set({ importError: 'Failed to parse CSV: ' + (error as Error).message });
        }
      },
      
      exportScheduleToCSV: () => {
        const { games, teams, courts } = get();
        const headers = ['Game ID', 'Day', 'Start Time', 'Court', 'Home Team', 'Away Team', 'Status'];
        
        const rows = games.map((game) => {
          const homeTeam = teams.find((t) => t.id === game.homeTeamId)?.name || 'Unknown';
          const awayTeam = teams.find((t) => t.id === game.awayTeamId)?.name || 'Unknown';
          const court = courts.find((c) => c.id === game.courtId)?.name || 'Unknown';
          
          return [
            game.id,
            game.day,
            game.startTime,
            court,
            homeTeam,
            awayTeam,
            game.status,
          ].join(',');
        });
        
        return [headers.join(','), ...rows].join('\n');
      },
      
      autoSchedule: () => {
        const { teams, courts, timeSlots, config } = get();
        
        if (teams.length < 2) {
          set({ importError: 'Need at least 2 teams to schedule' });
          return;
        }
        
        set({ isAutoScheduling: true });
        
        // Simple round-robin scheduling
        const games: Game[] = [];
        const gameCount = Math.min(config.gamesPerTeam, teams.length - 1);
        
        let slotIndex = 0;
        let courtIndex = 0;
        
        for (let round = 0; round < gameCount; round++) {
          for (let i = 0; i < Math.floor(teams.length / 2); i++) {
            const homeIdx = (round + i) % teams.length;
            const awayIdx = (round + teams.length - 1 - i) % teams.length;
            
            if (homeIdx === awayIdx) continue;
            
            const timeSlot = timeSlots[slotIndex % timeSlots.length];
            const court = courts[courtIndex % courts.length];
            
            games.push({
              id: `game-${Date.now()}-${games.length}`,
              homeTeamId: teams[homeIdx].id,
              awayTeamId: teams[awayIdx].id,
              courtId: court.id,
              timeSlotId: timeSlot.id,
              day: timeSlot.day,
              startTime: timeSlot.startTime,
              duration: config.gameDuration,
              status: 'scheduled',
            });
            
            courtIndex++;
            if (courtIndex % courts.length === 0) {
              slotIndex++;
            }
          }
        }
        
        set({ games, isAutoScheduling: false });
        
        // Validate and set conflicts
        const conflicts = get().validateSchedule();
        set({ conflicts });
      },
      
      validateSchedule: () => {
        const { games, teams, config } = get();
        const conflicts: ScheduleConflict[] = [];
        
        // Check for team double-booking
        const teamGames = new Map<string, Game[]>();
        games.forEach((game) => {
          if (!teamGames.has(game.homeTeamId)) teamGames.set(game.homeTeamId, []);
          if (!teamGames.has(game.awayTeamId)) teamGames.set(game.awayTeamId, []);
          teamGames.get(game.homeTeamId)!.push(game);
          teamGames.get(game.awayTeamId)!.push(game);
        });
        
        teamGames.forEach((games, teamId) => {
          const team = teams.find((t) => t.id === teamId);
          
          // Check same time slot
          const timeSlotCounts = new Map<string, number>();
          games.forEach((g) => {
            timeSlotCounts.set(g.timeSlotId, (timeSlotCounts.get(g.timeSlotId) || 0) + 1);
          });
          
          timeSlotCounts.forEach((count) => {
            if (count > 1) {
              conflicts.push({
                gameId: games[0].id,
                type: 'team-double-booked',
                description: `${team?.name || 'Team'} is scheduled for ${count} games at the same time`,
                severity: 'error',
              });
            }
          });
          
          // Check back-to-back games
          if (config.avoidBackToBack) {
            const sortedGames = games.sort((a, b) => {
              if (a.day !== b.day) return a.day - b.day;
              return a.startTime.localeCompare(b.startTime);
            });
            
            for (let i = 1; i < sortedGames.length; i++) {
              const prev = sortedGames[i - 1];
              const curr = sortedGames[i];
              
              if (prev.day === curr.day) {
                const prevEnd = parseInt(prev.startTime.split(':')[0]) * 60 + parseInt(prev.startTime.split(':')[1]) + prev.duration;
                const currStart = parseInt(curr.startTime.split(':')[0]) * 60 + parseInt(curr.startTime.split(':')[1]);
                
                if (currStart - prevEnd < config.minRestBetweenGames) {
                  conflicts.push({
                    gameId: curr.id,
                    type: 'back-to-back',
                    description: `${team?.name || 'Team'} has back-to-back games with insufficient rest`,
                    severity: 'warning',
                  });
                }
              }
            }
          }
        });
        
        return conflicts;
      },
      
      clearSchedule: () => set({ games: [], conflicts: [] }),
    }),
    {
      name: 'tournament-storage',
    }
  )
);
