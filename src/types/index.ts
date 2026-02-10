export interface Team {
  id: string;
  name: string;
  teamId?: string;
  ageGroup?: string;
  gradeLevel?: string;
  city?: string;
  wins?: number;
  losses?: number;
  group?: string;
  coach?: string;
  contact?: string;
}

export interface Game {
  id: string;
  team1Id: string;
  team2Id: string;
  court: number;
  timeSlot: number;
  day: number;
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
  groupByAge: boolean;
  groupByCity: boolean;
}

export interface Conflict {
  gameId: string;
  type: 'back-to-back' | 'insufficient-rest' | 'court-conflict';
  description: string;
  teamId?: string;
}

export type DragItem = {
  type: 'TEAM' | 'GAME';
  id: string;
  data: Team | Game;
};
