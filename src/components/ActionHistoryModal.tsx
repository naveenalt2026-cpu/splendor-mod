import React from 'react';
import { GameLogEntry } from '../types/game.ts';
import { X, History, Sparkles, Coins, Bookmark, Award, ShieldAlert } from 'lucide-react';

interface ActionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLogEntry[];
}

export const ActionHistoryModal: React.FC<ActionHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  const getActionIcon = (action: GameLogEntry['action']) => {
    switch (action) {
      case 'take_tokens':
        return <Coins size={14} className="text-amber-400" />;
      case 'buy_card':
        return <Sparkles size={14} className="text-emerald-400" />;
      case 'reserve_card':
        return <Bookmark size={14} className="text-blue-400" />;
      case 'noble_visit':
        return <Award size={14} className="text-yellow-300" />;
      case 'discard_tokens':
        return <ShieldAlert size={14} className="text-rose-400" />;
      default:
        return <History size={14} className="text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-2xl p-5 text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
          <div className="flex items-center gap-2">
            <History className="text-amber-400" size={20} />
            <h2 className="font-['Cinzel'] font-bold text-amber-200 text-lg uppercase tracking-wider">
              Chronicles & Move History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close History"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Log Entries */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/80">
          {logs.map((log) => (
            <div key={log.id} className="pt-2 flex items-start gap-2.5 text-xs">
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 mt-0.5">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Cinzel'] font-bold text-amber-200/90">
                    {log.playerName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Round {log.turn}
                  </span>
                </div>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  {log.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-['Cinzel'] font-bold text-xs uppercase cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
