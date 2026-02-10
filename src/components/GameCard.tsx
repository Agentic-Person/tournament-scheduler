import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AlertCircle, GripVertical, X } from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  isConflict?: boolean;
}

export function GameCard({ game, isConflict }: GameCardProps) {
  const teams = useTournamentStore((state) => state.teams);
  const courts = useTournamentStore((state) => state.courts);
  const removeGame = useTournamentStore((state) => state.removeGame);
  const selectedGame = useTournamentStore((state) => state.selectedGame);
  const setSelectedGame = useTournamentStore((state) => state.setSelectedGame);
  
  const [isHovered, setIsHovered] = useState(false);

  const homeTeam = teams.find((t) => t.id === game.homeTeamId);
  const awayTeam = teams.find((t) => t.id === game.awayTeamId);
  const court = courts.find((c) => c.id === game.courtId);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `game-${game.id}`,
    data: { type: 'GAME', game },
  });

  const isSelected = selectedGame === game.id;

  const getStatusColor = () => {
    switch (game.status) {
      case 'completed':
        return 'bg-green-900/30 border-green-700';
      case 'in-progress':
        return 'bg-blue-900/30 border-blue-700';
      case 'conflict':
      case 'scheduled':
      default:
        return isConflict 
          ? 'bg-red-900/30 border-red-700' 
          : 'bg-[#2a2a2a] border-[#444]';
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => setSelectedGame(isSelected ? null : game.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-3 rounded-lg border cursor-grab active:cursor-grabbing
        transition-all duration-200 min-h-[80px]
        ${isDragging ? 'opacity-50 scale-95 shadow-xl' : 'opacity-100'}
        ${getStatusColor()}
        ${isSelected ? 'ring-2 ring-[#8b7355] shadow-lg shadow-[#8b7355]/20' : ''}
        ${isHovered && !isSelected ? 'ring-1 ring-[#555]' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 text-stone-600">
        <GripVertical size={14} />
      </div>

      {/* Content */}
      <div className="pl-4">
        {/* Teams */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a08060]">H</span>
            <span className="text-sm font-medium text-stone-200 truncate">
              {homeTeam?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">A</span>
            <span className="text-sm font-medium text-stone-300 truncate">
              {awayTeam?.name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Court & Time */}
        <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
          <span>{court?.name || 'Unknown Court'}</span>
          {game.score && (
            <span className="text-[#a08060] font-medium">
              {game.score.home} - {game.score.away}
            </span>
          )}
        </div>
      </div>

      {/* Conflict Indicator */}
      {isConflict && (
        <div className="absolute top-1 right-1 text-red-400">
          <AlertCircle size={14} />
        </div>
      )}

      {/* Actions on Hover */}
      {isHovered && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Remove this game?')) {
                removeGame(game.id);
              }
            }}
            className="p-1 bg-[#1a1a1a]/80 text-stone-500 hover:text-red-400 
              rounded transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Status Badge */}
      {game.status !== 'scheduled' && (
        <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full
          ${game.status === 'completed' ? 'bg-green-500' : 
            game.status === 'in-progress' ? 'bg-blue-500' : 'bg-red-500'}`}
        />
      )}
    </div>
  );
}

interface EmptySlotProps {
  isOver?: boolean;
}

export function EmptySlot({ isOver }: EmptySlotProps) {
  return (
    <div
      className={`
        h-full min-h-[80px] rounded-lg border-2 border-dashed
        transition-all duration-200 flex items-center justify-center
        ${isOver 
          ? 'border-[#8b7355] bg-[#8b7355]/10' 
          : 'border-[#333] hover:border-[#444]'
        }
      `}
    >
      <span className="text-stone-600 text-xs">Drop here</span>
    </div>
  );
}
