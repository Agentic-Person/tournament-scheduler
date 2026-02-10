import React, { useState, useRef } from 'react';
import { useTournamentStore } from '../stores/tournamentStore';
import { Team } from '../types';
import { Plus, Upload, Trash2, FileSpreadsheet, Link as LinkIcon, X, Users, MapPin, GraduationCap } from 'lucide-react';

export const TeamSidebar: React.FC = () => {
  const { teams, addTeam, removeTeam, importTeamsFromCSV, clearAllTeams, getAgeGroups, getCities } = useTournamentStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ageGroups = getAgeGroups();
  const cities = getCities();

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      addTeam({
        id: crypto.randomUUID(),
        name: newTeamName.trim(),
      });
      setNewTeamName('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const count = importTeamsFromCSV(csv);
        alert(`Imported ${count} teams!`);
      };
      reader.readAsText(file);
    }
  };

  const extractSheetId = (url: string): string | null => {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleGoogleSheetImport = async () => {
    setImportError(null);
    setIsLoading(true);

    try {
      const sheetId = extractSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL. Please paste a valid share link.');
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Could not access the spreadsheet. Make sure it\'s shared publicly.');
      }
      
      const csv = await response.text();
      const importedCount = importTeamsFromCSV(csv);
      
      setShowGoogleSheetModal(false);
      setSheetUrl('');
      alert(`Successfully imported ${importedCount} teams!`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import from Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  // Group teams by age group for display
  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.ageGroup || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div className="w-80 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col">
      <div className="p-4 border-b border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#d4c4b0]">Teams</h2>
          <span className="text-2xl font-bold text-[#8b7355]">{teams.length}</span>
        </div>
        
        {/* Stats Summary */}
        {(ageGroups.length > 0 || cities.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            {ageGroups.map(group => (
              <span key={group} className="px-2 py-1 bg-[#3a3a3a] text-[#a08065] rounded-full">
                <GraduationCap size={12} className="inline mr-1" />
                {group}
              </span>
            ))}
            {cities.slice(0, 3).map(city => (
              <span key={city} className="px-2 py-1 bg-[#3a3a3a] text-[#8b9a6d] rounded-full">
                <MapPin size={12} className="inline mr-1" />
                {city}
              </span>
            ))}
            {cities.length > 3 && (
              <span className="px-2 py-1 bg-[#3a3a3a] text-[#666] rounded-full">
                +{cities.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Add Team */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
            placeholder="Team name..."
            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-[#e0e0e0] placeholder-[#666] focus:outline-none focus:border-[#8b7355]"
          />
          <button
            onClick={handleAddTeam}
            className="px-3 py-2 bg-[#8b7355] text-[#1a1a1a] rounded hover:bg-[#a08065] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Import Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#3a3a3a] text-[#d4c4b0] rounded hover:bg-[#4a4a4a] transition-colors text-sm"
          >
            <Upload size={16} />
            Import CSV File
          </button>
          
          <button
            onClick={() => setShowGoogleSheetModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#3a3a3a] text-[#d4c4b0] rounded hover:bg-[#4a4a4a] transition-colors text-sm"
          >
            <FileSpreadsheet size={16} />
            Import Google Sheets
          </button>
          
          {teams.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all teams?')) clearAllTeams();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Clear All Teams
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Team List - Grouped by Age */}
      <div className="flex-1 overflow-y-auto">
        {teams.length === 0 ? (
          <div className="p-4 text-center">
            <Users size={48} className="mx-auto text-[#3a3a3a] mb-2" />
            <p className="text-[#666]">No teams yet</p>
            <p className="text-[#666] text-sm">Import from Google Sheets or CSV</p>
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {Object.entries(groupedTeams).map(([group, groupTeams]) => (
              <div key={group}>
                <h3 className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider px-2 py-1">
                  {group} ({groupTeams.length})
                </h3>
                <div className="space-y-1">
                  {groupTeams.map((team) => (
                    <div
                      key={team.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('team', JSON.stringify(team));
                      }}
                      className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-move hover:border-[#8b7355] transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="text-[#e0e0e0] text-sm truncate">{team.name}</div>
                        <div className="flex items-center gap-2 text-xs text-[#666]">
                          {team.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {team.city}
                            </span>
                          )}
                          {team.wins !== undefined && team.losses !== undefined && (
                            <span className="text-[#8b9a6d]">
                              {team.wins}-{team.losses}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTeam(team.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#666] hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Sheets Modal */}
      {showGoogleSheetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-[500px] max-w-[90vw] border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#d4c4b0]">Import from Google Sheets</h3>
              <button
                onClick={() => setShowGoogleSheetModal(false)}
                className="text-[#666] hover:text-[#e0e0e0]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#a0a0a0] mb-2">
                  Google Sheets Share URL
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded">
                  <LinkIcon size={16} className="text-[#666]" />
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 bg-transparent text-[#e0e0e0] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded p-3 text-xs text-[#888]">
                <p className="mb-2"><strong>Supported columns:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code>Team Name</code> (required)</li>
                  <li><code>Age Group</code> - e.g., "2nd-4th Grade"</li>
                  <li><code>Grade Level</code> - e.g., "3rd"</li>
                  <li><code>City</code> - team location</li>
                  <li><code>Wins</code>, <code>Losses</code> - for seeding</li>
                </ul>
              </div>

              {importError && (
                <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
                  {importError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowGoogleSheetModal(false)}
                  className="flex-1 px-4 py-2 bg-[#3a3a3a] text-[#e0e0e0] rounded hover:bg-[#4a4a4a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoogleSheetImport}
                  disabled={isLoading || !sheetUrl}
                  className="flex-1 px-4 py-2 bg-[#8b7355] text-[#1a1a1a] rounded hover:bg-[#a08065] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={16} />
                      Import Teams
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
