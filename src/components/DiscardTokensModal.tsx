import React, { useState } from 'react';
import { Player, TokenCount, TokenType } from '../types/game.ts';
import { ALL_TOKENS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { AlertTriangle, Minus, Plus } from 'lucide-react';

interface DiscardTokensModalProps {
  player: Player;
  countToDiscard: number;
  onConfirmDiscard: (tokensToDiscard: Partial<TokenCount>) => void;
}

export const DiscardTokensModal: React.FC<DiscardTokensModalProps> = ({
  player,
  countToDiscard,
  onConfirmDiscard,
}) => {
  const [selectedDiscards, setSelectedDiscards] = useState<Partial<TokenCount>>({});

  const totalSelected = Object.values(selectedDiscards).reduce((acc, c) => acc + (c || 0), 0);
  const remainingNeeded = countToDiscard - totalSelected;

  const handleIncrement = (token: TokenType) => {
    const currentSelected = selectedDiscards[token] || 0;
    const playerHas = player.tokens[token] || 0;
    if (currentSelected < playerHas && remainingNeeded > 0) {
      setSelectedDiscards({
        ...selectedDiscards,
        [token]: currentSelected + 1,
      });
    }
  };

  const handleDecrement = (token: TokenType) => {
    const currentSelected = selectedDiscards[token] || 0;
    if (currentSelected > 0) {
      setSelectedDiscards({
        ...selectedDiscards,
        [token]: currentSelected - 1,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md landscape:max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#121826] border border-rose-500/60 shadow-2xl p-5 landscape:p-4 text-slate-200">
        <div className="flex items-center gap-2 text-rose-400 mb-2">
          <AlertTriangle size={20} />
          <h2 className="font-['Cinzel'] font-bold text-base uppercase tracking-wider text-rose-300">
            Excess Tokens Limit
          </h2>
        </div>

        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          You are holding more than the allowable 10 tokens limit. You must return{' '}
          <strong className="text-rose-400 font-bold">{countToDiscard} token(s)</strong> to the bank.
        </p>

        {/* Token selection list */}
        <div className="grid grid-cols-1 landscape:grid-cols-2 gap-2 mb-4">
          {ALL_TOKENS.map(token => {
            const held = player.tokens[token] || 0;
            if (held === 0) return null;
            const discarded = selectedDiscards[token] || 0;

            return (
              <div
                key={token}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <GemIcon type={token} size="sm" variant={token === 'gold' ? 'chip' : 'disc'} />
                  <div>
                    <span className="text-xs font-bold capitalize text-slate-200">
                      {TOKEN_COLORS[token].name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Held: {held} (Keep: {held - discarded})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecrement(token)}
                    disabled={discarded === 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center font-bold text-xs text-rose-300">
                    {discarded}
                  </span>
                  <button
                    onClick={() => handleIncrement(token)}
                    disabled={discarded >= held || remainingNeeded === 0}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400">
            Selected: <span className="text-rose-400 font-bold">{totalSelected}</span> / {countToDiscard}
          </div>

          <button
            onClick={() => onConfirmDiscard(selectedDiscards)}
            disabled={totalSelected !== countToDiscard}
            className={`px-5 py-2 rounded-xl font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all ${
              totalSelected === countToDiscard
                ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-950/60'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Confirm Discard
          </button>
        </div>
      </div>
    </div>
  );
};
