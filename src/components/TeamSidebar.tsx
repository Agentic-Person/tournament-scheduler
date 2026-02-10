import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus, Upload, Users, Trash2, Edit2, X, Check } from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';
import type { Team } from '../types';

interface DraggableTeamProps {
  team: Team;
  isSelected: boolean;
  onSelect: () => void;
}

function DraggableTeam({ team, isSelected, onSelect }: DraggableTeamProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `team-${team.id}`,
    data: { type: 'TEAM', team },
  });
  
  const removeTeam = useTournamentStore((state) => state.removeTeam);
  const [isEditing, setIsEditing] = useState(false);
  const updateTeam = useTournamentStore((state) => state.updateTeam);
  const [editName, setEditName] = useState(team.name);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#2a2a2a] rounded-lg">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 bg-[#1a1a1a] text-stone-200 px-2 py-1 rounded text-sm"
          autoFocus
        />
        <button
          onClick={() => {
            updateTeam(team.id, { name: editName });
            setIsEditing(false);
          }}
          className="text-green-500 hover:text-green-400"
        >
          <Check size={16} />
        </button>
        <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={`
        group relative p-3 rounded-lg cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isSelected 
          ? 'bg-[#4a3f35] border border-[#8b7355] shadow-lg shadow-[#8b7355]/20' 
          : 'bg-[#2a2a2a] hover:bg-[#333] border border-transparent hover:border-[#555]'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-stone-200 font-medium truncate">{team.name}</h4>
          {team.group && (
            <span className="text-xs text-[#a08060]">Group: {team.group}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-stone-500 hover:text-stone-300 rounded"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete team "${team.name}"?`)) {
                removeTeam(team.id);
              }
            }}
            className="p-1 text-stone-500 hover:text-red-400 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {team.coach && (
        <p className="text-xs text-stone-500 mt-1">Coach: {team.coach}</p>
      )}
    </div>
  );
}

export function TeamSidebar() {
  const teams = useTournamentStore((state) => state.teams);
  const addTeam = useTournamentStore((state) => state.addTeam);
  const importTeamsFromCSV = useTournamentStore((state) => state.importTeamsFromCSV);
  const importError = useTournamentStore((state) => state.importError);
  const setImportError = useTournamentStore((state) => state.setImportError);
  const selectedTeam = useTournamentStore((state) => state.selectedTeam);
  const setSelectedTeam = useTournamentStore((state) => state.setSelectedTeam);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      addTeam({
        id: `team-${Date.now()}`,
        name: newTeamName.trim(),
        maxGamesPerDay: 2,
        minRestBetweenGames: 30,
      });
      setNewTeamName('');
      setIsAdding(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importTeamsFromCSV(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-80 bg-[#1a1a1a] border-r border-[#333] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="text-[#a08060]" size={20} />
            <h2 className="text-lg font-semibold text-stone-200">Teams</h2>
          </div>
          <span className="text-sm text-stone-500">{teams.length}</span>
        </div>
        
        {/* CSV Upload */}
        <label className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#333] 
          text-stone-300 rounded-lg cursor-pointer transition-colors text-sm">
          <Upload size={16} />
          <span>Import CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </label>
        
        {importError && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
            {importError}
            <button 
              onClick={() => setImportError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Teams List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {teams.length === 0 ? (
          <div className="text-center py-8 text-stone-600">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No teams yet</p>
            <p className="text-xs mt-1">Add teams or import from CSV</p>
          </div>
        ) : (
          teams.map((team) => (
            <DraggableTeam
              key={team.id}
              team={team}
              isSelected={selectedTeam === team.id}
              onSelect={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
            />
          ))
        )}
      </div>

      {/* Add Team */}
      <div className="p-4 border-t border-[#333]">
        {isAdding ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              placeholder="Team name"
              className="flex-1 bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
              autoFocus
            />
            <button
              onClick={handleAddTeam}
              className="px-3 py-2 bg-[#8b7355] hover:bg-[#9a8265] text-stone-900 
                rounded-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 
              bg-[#2a2a2a] hover:bg-[#333] text-stone-300 rounded-lg 
              transition-colors text-sm"
          >
            <Plus size={16} />
            Add Team
          </button>
        )}
      </div>
    </div>
  );
}
