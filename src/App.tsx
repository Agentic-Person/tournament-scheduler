import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { Trophy, Github, HelpCircle } from 'lucide-react';
import { TeamSidebar } from './components/TeamSidebar';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ConfigPanel } from './components/ConfigPanel';
import { GameCard } from './components/GameCard';
import { useTournamentStore } from './stores/tournamentStore';
import type { Team, Game } from './types';

function App() {
  const [activeDrag, setActiveDrag] = useState<{ type: 'TEAM' | 'GAME'; data: Team | Game } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const teams = useTournamentStore((state) => state.teams);
  const addGame = useTournamentStore((state) => state.addGame);
  const moveGame = useTournamentStore((state) => state.moveGame);
  const timeSlots = useTournamentStore((state) => state.timeSlots);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as 'TEAM' | 'GAME';
    
    if (type === 'TEAM') {
      setActiveDrag({ type: 'TEAM', data: active.data.current?.team });
    } else if (type === 'GAME') {
      setActiveDrag({ type: 'GAME', data: active.data.current?.game });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveDrag(null);
      return;
    }

    const activeType = active.data.current?.type;
    const overId = over.id as string;

    // Handle dropping team onto a slot to create a new game
    if (activeType === 'TEAM' && overId.startsWith('slot-')) {
      const slotData = over.data.current;
      if (!slotData) return;
      
      const { timeSlotId, courtId, day } = slotData;
      const timeSlot = timeSlots.find((t) => t.id === timeSlotId);
      
      if (!timeSlot) return;

      // Find an opponent team
      const draggedTeam = active.data.current?.team as Team;
      const availableOpponent = teams.find(
        (t) => t.id !== draggedTeam.id
      );

      if (availableOpponent) {
        addGame({
          id: `game-${Date.now()}`,
          homeTeamId: draggedTeam.id,
          awayTeamId: availableOpponent.id,
          courtId,
          timeSlotId,
          day,
          startTime: timeSlot.startTime,
          duration: 45,
          status: 'scheduled',
        });
      }
    }

    // Handle moving existing game to a new slot
    if (activeType === 'GAME' && overId.startsWith('slot-')) {
      const slotData = over.data.current;
      if (!slotData) return;
      
      const { timeSlotId, courtId } = slotData;
      const gameId = (active.data.current?.game as Game).id;
      
      moveGame(gameId, timeSlotId, courtId);
    }

    setActiveDrag(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-[#0f0f0f] text-stone-200">
        {/* Header */}
        <header className="h-16 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8b7355] rounded-lg flex items-center justify-center">
              <Trophy className="text-stone-900" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-100">Tournament Scheduler</h1>
              <p className="text-xs text-stone-500">AI-Powered Basketball Tournament Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-stone-200 
                transition-colors text-sm"
            >
              <HelpCircle size={18} />
              Help
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-stone-200 
                transition-colors text-sm"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </header>

        {/* Help Panel */}
        {showHelp && (
          <div className="bg-[#1a1a1a] border-b border-[#333] p-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-semibold text-[#a08060] mb-3">Quick Start Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-[#2a2a2a] rounded-lg">
                  <span className="text-[#a08060] font-medium">1. Add Teams</span>
                  <p className="text-stone-500 mt-1">
                    Import from CSV or add teams manually in the left sidebar.
                  </p>
                </div>
                <div className="p-3 bg-[#2a2a2a] rounded-lg">
                  <span className="text-[#a08060] font-medium">2. Configure</span>
                  <p className="text-stone-500 mt-1">
                    Set game duration, rest periods, and other constraints.
                  </p>
                </div>
                <div className="p-3 bg-[#2a2a2a] rounded-lg">
                  <span className="text-[#a08060] font-medium">3. Schedule</span>
                  <p className="text-stone-500 mt-1">
                    Click Auto Schedule or drag teams/games manually to time slots.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <TeamSidebar />
          <ScheduleGrid />
          <div className="w-80">
            <ConfigPanel />
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDrag?.type === 'TEAM' && (
          <div className="p-3 bg-[#4a3f35] border border-[#8b7355] rounded-lg shadow-xl
            cursor-grabbing opacity-90">
            <div className="text-stone-200 font-medium">{(activeDrag.data as Team).name}</div>
            <div className="text-xs text-[#a08060]">Drag to schedule</div>
          </div>
        )}
        {activeDrag?.type === 'GAME' && (
          <div className="opacity-90 cursor-grabbing">
            <GameCard game={activeDrag.data as Game} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
