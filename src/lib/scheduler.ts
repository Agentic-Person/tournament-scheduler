import { Team, Game, TournamentConfig, Conflict } from '../types';

export function generateSchedule(teams: Team[], _config: TournamentConfig): Game[] {
  const games: Game[] = [];

  // Simple round-robin scheduling
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const game: Game = {
        id: `game-${i}-${j}`,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        court: 1,
        day: 1,
        timeSlot: games.length % (_config.timeSlots?.length || 1),
        scheduled: true,
      };
      games.push(game);
    }
  }

  return games;
}

export function detectConflicts(games: Game[], _config: TournamentConfig): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check for same team playing at same time
  for (let i = 0; i < games.length; i++) {
    for (let j = i + 1; j < games.length; j++) {
      const g1 = games[i];
      const g2 = games[j];

      if (g1.day === g2.day && g1.timeSlot === g2.timeSlot) {
        if (g1.team1Id === g2.team1Id || g1.team1Id === g2.team2Id ||
            g1.team2Id === g2.team1Id || g1.team2Id === g2.team2Id) {
          conflicts.push({
            gameId: g1.id,
            type: 'same-team',
            message: `Team playing in multiple games at same time`,
          });
        }
      }
    }
  }

  return conflicts;
}
