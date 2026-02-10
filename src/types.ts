export type TeamTier = 'novice' | 'intermediate' | 'advanced';
export type Gender = 'male' | 'female';

export interface Team {
  id: string;
  name: string;
  // Legacy fields (for backward compatibility)
  tier?: TeamTier;
  gender?: Gender;
  // New fields from spreadsheet
  ageGroup?: string;      // e.g., "2nd-4th Grade"
  gradeLevel?: string;    // e.g., "3rd", "4th"
  city?: string;          // e.g., "Minneapolis"
  wins?: number;
  losses?: number;
  teamId?: string;        // Original team ID from sheet
}

export interface Game {
  id: string;
  team1Id: string;
  team2Id: string;
  court: number;
  day: number;
  timeSlot: number;
  scheduled?: boolean;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'conflict';
  score?: {
    home: number;
    away: number;
  };
}

export interface TournamentConfig {
  name: string;
  startDate: string;
  days: number;
  gamesPerTeam: number;
  gameDuration: number;
  restPeriod: number;
  avoidBackToBack: boolean;
  courts: number;
  timeSlots: string[];
  // Grouping options
  groupByAge?: boolean;
  groupByCity?: boolean;
}

export interface Conflict {
  gameId: string;
  type: 'back-to-back' | 'same-team' | 'court-overlap';
  message: string;
  description?: string;
  severity?: 'warning' | 'error';
}
