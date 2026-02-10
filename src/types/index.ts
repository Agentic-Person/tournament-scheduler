export interface Team {
  id: string;
  name: string;
  group?: string;
  coach?: string;
  contact?: string;
  maxGamesPerDay: number;
  minRestBetweenGames: number; // in minutes
  preferredTimes?: string[];
  unavailableSlots?: string[];
}

export interface Court {
  id: string;
  name: string;
  location?: string;
}

export interface TimeSlot {
  id: string;
  day: number; // 1 or 2
  startTime: string; // "09:00"
  endTime: string; // "09:45"
  duration: number; // in minutes
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  courtId: string;
  timeSlotId: string;
  day: number;
  startTime: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'conflict';
  score?: {
    home: number;
    away: number;
  };
}

export interface TournamentConfig {
  name: string;
  startDate: string;
  numberOfDays: number;
  gamesPerTeam: number;
  courts: Court[];
  timeSlots: TimeSlot[];
  gameDuration: number; // in minutes
  minRestBetweenGames: number;
  avoidBackToBack: boolean;
}

export interface SchedulingConstraint {
  type: 'rest' | 'back-to-back' | 'court-availability' | 'team-availability';
  description: string;
  weight: number; // 1-10, higher = more important
}

export interface ScheduleConflict {
  gameId: string;
  type: 'team-double-booked' | 'court-double-booked' | 'insufficient-rest' | 'back-to-back';
  description: string;
  severity: 'warning' | 'error';
}

export type DragItem = {
  type: 'TEAM' | 'GAME';
  id: string;
  data: Team | Game;
};
