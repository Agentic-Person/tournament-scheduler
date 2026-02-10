import { useDroppable } from '@dnd-kit/core';
import { GameCard, EmptySlot } from './GameCard';
import { useTournamentStore } from '../stores/tournamentStore';
import type { Game } from '../types';

interface ScheduleCellProps {
  timeSlotId: string;
  courtId: string;
  day: number;
  game?: Game;
  isConflict?: boolean;
}

function ScheduleCell({ timeSlotId, courtId, day, game, isConflict }: ScheduleCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${day}-${timeSlotId}-${courtId}`,
    data: { timeSlotId, courtId, day },
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {game ? (
        <GameCard game={game} isConflict={isConflict} />
      ) : (
        <EmptySlot isOver={isOver} />
      )}
    </div>
  );
}

interface DayScheduleProps {
  day: number;
}

function DaySchedule({ day }: DayScheduleProps) {
  const timeSlots = useTournamentStore((state) => 
    state.timeSlots.filter((t) => t.day === day)
  );
  const courts = useTournamentStore((state) => state.courts);
  const games = useTournamentStore((state) => state.games);
  const conflicts = useTournamentStore((state) => state.conflicts);

  // Group time slots by start time
  const timeGroups = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.startTime]) {
      acc[slot.startTime] = [];
    }
    acc[slot.startTime].push(slot);
    return acc;
  }, {} as Record<string, typeof timeSlots>);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-stone-200 sticky top-0 bg-[#1a1a1a] py-2 z-10">
        Day {day}
      </h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header - Courts */}
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `100px repeat(${courts.length}, 1fr)` }}>
            <div className="text-xs text-stone-500 font-medium">Time</div>
            {courts.map((court) => (
              <div 
                key={court.id} 
                className="text-xs text-[#a08060] font-medium text-center py-2 bg-[#2a2a2a] rounded"
              >
                {court.name}
                {court.location && (
                  <span className="block text-[10px] text-stone-600">{court.location}</span>
                )}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            {Object.entries(timeGroups).map(([time, slots]) => {
              const slot = slots[0]; // Use first slot for this time
              
              return (
                <div 
                  key={time} 
                  className="grid gap-2" 
                  style={{ gridTemplateColumns: `100px repeat(${courts.length}, 1fr)` }}
                >
                  {/* Time Label */}
                  <div className="flex items-center text-sm text-stone-400 font-medium">
                    {time}
                  </div>
                  
                  {/* Court Cells */}
                  {courts.map((court) => {
                    const game = games.find(
                      (g) => g.timeSlotId === slot.id && g.courtId === court.id
                    );
                    const hasConflict = conflicts.some(
                      (c) => c.gameId === game?.id
                    );
                    
                    return (
                      <ScheduleCell
                        key={`${slot.id}-${court.id}`}
                        timeSlotId={slot.id}
                        courtId={court.id}
                        day={day}
                        game={game}
                        isConflict={hasConflict}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScheduleGrid() {
  const games = useTournamentStore((state) => state.games);
  const teams = useTournamentStore((state) => state.teams);
  const conflicts = useTournamentStore((state) => state.conflicts);
  const isAutoScheduling = useTournamentStore((state) => state.isAutoScheduling);

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#1a1a1a]">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-[#2a2a2a] rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#a08060]">{teams.length}</div>
          <div className="text-xs text-stone-500">Teams</div>
        </div>
        <div className="w-px h-10 bg-[#444]" />
        <div className="text-center">
          <div className="text-2xl font-bold text-stone-200">{games.length}</div>
          <div className="text-xs text-stone-500">Games</div>
        </div>
        <div className="w-px h-10 bg-[#444]" />
        <div className="text-center">
          <div className={`text-2xl font-bold ${conflicts.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {conflicts.length}
          </div>
          <div className="text-xs text-stone-500">Conflicts</div>
        </div>
        
        {isAutoScheduling && (
          <div className="flex items-center gap-2 text-[#a08060]">
            <div className="w-4 h-4 border-2 border-[#a08060] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Scheduling...</span>
          </div>
        )}
      </div>

      {/* Conflicts Panel */}
      {conflicts.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <h4 className="text-sm font-semibold text-red-300 mb-2">Scheduling Conflicts</h4>
          <ul className="space-y-1">
            {conflicts.map((conflict, idx) => (
              <li key={idx} className="text-xs text-red-300/80 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${conflict.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                {conflict.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Schedule */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-stone-600">
          <div className="text-6xl mb-4">🏀</div>
          <h3 className="text-xl font-semibold mb-2">No Games Scheduled</h3>
          <p className="text-sm text-center max-w-md">
            Add teams from the sidebar, then click "Auto Schedule" to generate a schedule,
            or drag teams directly onto time slots to create games manually.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <DaySchedule day={1} />
          <DaySchedule day={2} />
        </div>
      )}
    </div>
  );
}
