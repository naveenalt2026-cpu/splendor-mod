import React from 'react';
import { GemType, TokenCount, TokenType } from '../types/game.ts';
import { ALL_GEMS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { canTakeTokens } from '../game/rules.ts';
import { Check, X, Coins } from 'lucide-react';

interface GemChipRackProps {
  bank: TokenCount;
  stagedGems?: GemType[];
  onToggleStagedGem?: (gem: GemType) => void;
  onClearStaged?: () => void;
  onConfirmTake?: () => void;
  disabled?: boolean;
}

export const GemChipRack: React.FC<GemChipRackProps> = ({
  bank,
  stagedGems = [],
  onToggleStagedGem,
  onClearStaged,
  onConfirmTake,
  disabled = false,
}) => {
  const isInteractive = Boolean(onToggleStagedGem);
  const validation = canTakeTokens(stagedGems, bank);
  const isValidCombination = validation.valid;

  const stagedCounts = stagedGems.reduce<Record<string, number>>((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside
      className="relative flex flex-row lg:flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#121826] border border-white/8 shadow-xl backdrop-blur-md z-10 w-full lg:w-36 shrink-0"
      aria-label="Gem Bank"
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 mb-0 lg:mb-3 pb-0 lg:pb-2.5 border-b-0 lg:border-b border-white/10 w-full justify-center">
        <Coins size={14} className="text-amber-400" />
        <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200">
          Gem Bank
        </span>
      </div>

      {/* Vertical Stacks for 5 Gems + Gold */}
      <div className="flex flex-row lg:flex-col gap-2.5 sm:gap-3 items-center justify-center w-full flex-wrap sm:flex-nowrap">
        {ALL_GEMS.map(gem => {
          const availableCount = bank[gem] || 0;
          const stagedCount = stagedCounts[gem] || 0;
          const isStaged = stagedCount > 0;
          const isExhausted = availableCount === 0;

          return (
            <div
              key={gem}
              onClick={() => isInteractive && onToggleStagedGem && onToggleStagedGem(gem)}
              className={`relative flex items-center justify-between w-full p-1.5 rounded-xl border transition-all ${
                isStaged
                  ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-[#0B0F1A]/80 border-white/5 hover:border-white/15'
              } ${
                isInteractive && !disabled && !isExhausted ? 'cursor-pointer active:scale-95' : ''
              } ${isExhausted ? 'opacity-35' : ''}`}
            >
              <div className="flex items-center gap-2">
                <GemIcon
                  type={gem}
                  size="md"
                  variant="gem"
                  showGlow={isStaged}
                />
                <span className="text-xs font-['Cinzel'] text-slate-300 capitalize hidden sm:inline">
                  {gem}
                </span>
              </div>

              {/* Large Clear Count */}
              <div className="flex items-center gap-1 pr-1">
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {availableCount}
                </span>
                {isStaged && (
                  <span className="text-xs font-bold text-amber-400">
                    (+{stagedCount})
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Gold Joker Coin */}
        <div className="relative flex items-center justify-between w-full p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center gap-2">
            <GemIcon type="gold" size="md" variant="chip" />
            <span className="text-xs font-['Cinzel'] text-amber-200 capitalize hidden sm:inline">
              Gold
            </span>
          </div>

          <div className="flex items-center gap-1 pr-1">
            <span className="text-base sm:text-lg font-mono font-bold text-amber-300">
              {bank.gold}
            </span>
          </div>
        </div>
      </div>

      {/* Staged Action Bar (for interactive solo play) */}
      {stagedGems.length > 0 && isInteractive && onConfirmTake && (
        <div className="mt-3 pt-3 border-t border-white/10 w-full flex flex-col gap-1.5 items-center animate-fade-in">
          <button
            type="button"
            onClick={onConfirmTake}
            disabled={!isValidCombination || disabled}
            className={`w-full py-1.5 px-2 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all ${
              isValidCombination && !disabled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Check size={13} />
            <span>Take ({stagedGems.length})</span>
          </button>

          {onClearStaged && (
            <button
              type="button"
              onClick={onClearStaged}
              className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
