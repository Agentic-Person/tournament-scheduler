import { 
  Settings, Play, Download, Trash2 
} from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';

export function ConfigPanel() {
  const config = useTournamentStore((state) => state.config);
  const setConfig = useTournamentStore((state) => state.setConfig);
  const teams = useTournamentStore((state) => state.teams);
  const games = useTournamentStore((state) => state.games);
  const autoSchedule = useTournamentStore((state) => state.autoSchedule);
  const clearSchedule = useTournamentStore((state) => state.clearSchedule);
  const exportScheduleToCSV = useTournamentStore((state) => state.exportScheduleToCSV);
  const isAutoScheduling = useTournamentStore((state) => state.isAutoScheduling);

  const handleExport = () => {
    const csv = exportScheduleToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canSchedule = teams.length >= 2;

  return (
    <div className="h-full bg-[#1a1a1a] border-l border-[#333] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-center gap-2 text-stone-200">
          <Settings size={20} className="text-[#a08060]" />
          <h2 className="text-lg font-semibold">Configuration</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wider">Actions</h3>
          
          <button
            onClick={() => {
              if (!canSchedule) {
                alert('Need at least 2 teams to schedule');
                return;
              }
              autoSchedule();
            }}
            disabled={!canSchedule || isAutoScheduling}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              font-medium transition-all duration-200
              ${canSchedule && !isAutoScheduling
                ? 'bg-[#8b7355] hover:bg-[#9a8265] text-stone-900 shadow-lg shadow-[#8b7355]/20'
                : 'bg-[#333] text-stone-600 cursor-not-allowed'
              }
            `}
          >
            {isAutoScheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Play size={18} />
                Auto Schedule
              </>
            )}
          </button>

          {games.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all scheduled games?')) {
                  clearSchedule();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                bg-red-900/30 hover:bg-red-900/50 text-red-300 
                border border-red-800 rounded-lg transition-colors text-sm"
            >
              <Trash2 size={16} />
              Clear Schedule
            </button>
          )}
        </div>

        {/* Tournament Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wider">Tournament</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Tournament Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ name: e.target.value })}
                className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                  border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">Start Date</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ startDate: e.target.value })}
                className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                  border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Days</label>
                <select
                  value={config.days}
                  onChange={(e) => setConfig({ days: parseInt(e.target.value) })}
                  className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                    border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
                >
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Games/Team</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.gamesPerTeam}
                  onChange={(e) => setConfig({ gamesPerTeam: parseInt(e.target.value) })}
                  className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                    border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wider">Constraints</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Game Duration (min)</label>
              <input
                type="number"
                min={15}
                max={120}
                step={5}
                value={config.gameDuration}
                onChange={(e) => setConfig({ gameDuration: parseInt(e.target.value) })}
                className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                  border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">Min Rest Between Games (min)</label>
              <input
                type="number"
                min={0}
                max={120}
                step={5}
                value={config.restPeriod}
                onChange={(e) => setConfig({ restPeriod: parseInt(e.target.value) })}
                className="w-full bg-[#2a2a2a] text-stone-200 px-3 py-2 rounded-lg 
                  border border-[#444] focus:border-[#8b7355] focus:outline-none text-sm"
              />
            </div>

            <label className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.avoidBackToBack}
                onChange={(e) => setConfig({ avoidBackToBack: e.target.checked })}
                className="w-4 h-4 rounded border-[#555] bg-[#1a1a1a] 
                  checked:bg-[#8b7355] checked:border-[#8b7355]"
              />
              <div>
                <span className="text-sm text-stone-300 block">Avoid Back-to-Back</span>
                <span className="text-xs text-stone-500">Prevent consecutive games</span>
              </div>
            </label>
          </div>
        </div>

        {/* Export/Import */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wider">Export</h3>
          
          <button
            onClick={handleExport}
            disabled={games.length === 0}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              transition-colors text-sm
              ${games.length > 0
                ? 'bg-[#2a2a2a] hover:bg-[#333] text-stone-300 border border-[#444]'
                : 'bg-[#2a2a2a] text-stone-600 cursor-not-allowed border border-[#333]'
              }
            `}
          >
            <Download size={16} />
            Export Schedule CSV
          </button>
        </div>

        {/* Stats Summary */}
        <div className="p-4 bg-[#2a2a2a] rounded-lg space-y-2">
          <h3 className="text-sm font-medium text-stone-400">Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-stone-500">Teams:</div>
            <div className="text-stone-200 text-right">{teams.length}</div>
            <div className="text-stone-500">Games:</div>
            <div className="text-stone-200 text-right">{games.length}</div>
            <div className="text-stone-500">Courts:</div>
            <div className="text-stone-200 text-right">{config.courts}</div>
            <div className="text-stone-500">Time Slots:</div>
            <div className="text-stone-200 text-right">{config.timeSlots.length.toString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
