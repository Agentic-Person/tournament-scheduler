import React, { useState, useRef } from 'react';
import { useTournamentStore } from '../stores/tournamentStore';
import { Team } from '../types';
import { Plus, Upload, Trash2, FileSpreadsheet, Link as LinkIcon, X } from 'lucide-react';

export const TeamSidebar: React.FC = () => {
  const { teams, addTeam, removeTeam, importTeamsFromCSV } = useTournamentStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      addTeam({
        id: crypto.randomUUID(),
        name: newTeamName.trim(),
        tier: 'novice',
        gender: 'male',
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
        importTeamsFromCSV(csv);
      };
      reader.readAsText(file);
    }
  };

  const extractSheetId = (url: string): string | null => {
    // Handle various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/e\/([a-zA-Z0-9-_]+)/,
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

      // Convert Google Sheets to CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Could not access the spreadsheet. Make sure it\'s shared publicly or with anyone with the link.');
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

  return (
    <div className="w-80 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col">
      <div className="p-4 border-b border-[#3a3a3a]">
        <h2 className="text-lg font-semibold text-[#d4c4b0] mb-4">Teams ({teams.length})</h2>
        
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Team List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {teams.length === 0 ? (
          <p className="text-[#666] text-center py-8">
            No teams yet. Add teams or import from CSV/Google Sheets.
          </p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('team', JSON.stringify(team));
                }}
                className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#3a3a3a] cursor-move hover:border-[#8b7355] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8b7355]" />
                  <span className="text-[#e0e0e0] text-sm">{team.name}</span>
                </div>
                <button
                  onClick={() => removeTeam(team.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#666] hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample Data */}
      {teams.length === 0 && (
        <div className="p-4 border-t border-[#3a3a3a]">
          <p className="text-xs text-[#666] mb-2">Expected CSV format:</p>
          <code className="text-xs text-[#8b7355] block bg-[#1a1a1a] p-2 rounded">
            name,tier,gender<br/>
            Team A,novice,male<br/>
            Team B,intermediate,female
          </code>
        </div>
      )}

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
                <p className="mb-2"><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your Google Sheet</li>
                  <li>Click <strong>Share</strong> → <strong>Anyone with the link</strong> (Viewer)</li>
                  <li>Copy the share URL and paste above</li>
                  <li>Sheet should have columns: <code>name,tier,gender</code></li>
                </ol>
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
