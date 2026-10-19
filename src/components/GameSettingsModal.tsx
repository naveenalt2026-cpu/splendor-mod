import React, { useState } from 'react';
import { X, Settings, Users, BrainCircuit, Target, Check } from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    playerCount: number;
    aiDifficulty: 'easy' | 'medium' | 'hard';
    targetVP: number;
  };
  onApplySettings: (newSettings: {
    playerCount: number;
    aiDifficulty: 'easy' | 'medium' | 'hard';
    targetVP: number;
  }) => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApplySettings,
}) => {
  const [playerCount, setPlayerCount] = useState(currentSettings.playerCount);
  const [aiDifficulty, setAiDifficulty] = useState(currentSettings.aiDifficulty);
  const [targetVP, setTargetVP] = useState(currentSettings.targetVP);

  if (!isOpen) return null;

  const handleSave = () => {
    onApplySettings({ playerCount, aiDifficulty, targetVP });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-2xl p-6 text-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-amber-400" size={22} />
            <h2 className="font-['Cinzel'] font-bold text-amber-200 text-lg uppercase tracking-wider">
              Match Setup & AI Options
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 mb-6">
          {/* Opponents Count */}
          <div>
            <label className="font-['Cinzel'] font-bold text-xs text-amber-300 block mb-2 flex items-center gap-1.5">
              <Users size={14} />
              Match Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 2, label: '1v1 Solo Duel', sub: 'You vs 1 AI' },
                { count: 3, label: '3 Players', sub: 'You vs 2 AIs' },
                { count: 4, label: '4 Players', sub: 'You vs 3 AIs' },
              ].map(opt => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setPlayerCount(opt.count)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    playerCount === opt.count
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs block">{opt.label}</span>
                  <span className="text-[10px] text-slate-400">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="font-['Cinzel'] font-bold text-xs text-amber-300 block mb-2 flex items-center gap-1.5">
              <BrainCircuit size={14} />
              AI Opponent Intelligence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy' as const, name: 'Novice', desc: 'Relaxed & simple' },
                { id: 'medium' as const, name: 'Tactician', desc: 'Balanced & smart' },
                { id: 'hard' as const, name: 'Grandmaster', desc: 'Ruthless & noble-focused' },
              ].map(diff => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setAiDifficulty(diff.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    aiDifficulty === diff.id
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs block">{diff.name}</span>
                  <span className="text-[10px] text-slate-400">{diff.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Prestige Points */}
          <div>
            <label className="font-['Cinzel'] font-bold text-xs text-amber-300 block mb-2 flex items-center gap-1.5">
              <Target size={14} />
              Victory Threshold
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { points: 10, name: 'Blitz', sub: '10 VP (Fast)' },
                { points: 15, name: 'Standard', sub: '15 VP (Official)' },
                { points: 21, name: 'Epic', sub: '21 VP (Long)' },
              ].map(opt => (
                <button
                  key={opt.points}
                  type="button"
                  onClick={() => setTargetVP(opt.points)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    targetVP === opt.points
                      ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-['Cinzel'] font-bold text-xs block">{opt.name}</span>
                  <span className="text-[10px] text-slate-400">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-['Cinzel'] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-['Cinzel'] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            <span>Start New Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
