import React from 'react';
import { GemType, TokenCount, TokenType } from '../types/game.ts';
import { ALL_GEMS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { canTakeTokens } from '../game/rules.ts';
import { Check, X } from 'lucide-react';

interface GemChipRackProps {
  bank: TokenCount;
  stagedGems: GemType[];
  onToggleStagedGem: (gem: GemType) => void;
  onClearStaged: () => void;
  onConfirmTake: () => void;
  disabled?: boolean;
}

export const GemChipRack: React.FC<GemChipRackProps> = ({
  bank,
  stagedGems,
  onToggleStagedGem,
  onClearStaged,
  onConfirmTake,
  disabled = false,
}) => {
  const validation = canTakeTokens(stagedGems, bank);
  const isValidCombination = validation.valid;

  // Count how many of each gem are currently staged
  const stagedCounts = stagedGems.reduce<Record<string, number>>((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside
      className="relative flex flex-row lg:flex-col items-center justify-between lg:justify-center p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-md z-10 w-full lg:w-auto"
      aria-label="Gem Token Bank"
    >
      {/* Ornate title */}
      <div className="font-['Cinzel'] font-bold text-amber-200/90 text-xs tracking-wider uppercase mb-0 lg:mb-3 hidden sm:flex items-center gap-1">
        <span>Gem Bank</span>
      </div>

      {/* Gem Chips Stack (Horizontal on mobile, Vertical on desktop) */}
      <div className="flex flex-row lg:flex-col gap-2 sm:gap-3.5 items-center justify-center flex-wrap sm:flex-nowrap">
        {ALL_GEMS.map(gem => {
          const availableCount = bank[gem] || 0;
          const stagedCount = stagedCounts[gem] || 0;
          const isStaged = stagedCount > 0;
          const isExhausted = availableCount === 0;

          return (
            <div key={gem} className="relative group flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleStagedGem(gem)}
                disabled={disabled || (isExhausted && stagedCount === 0)}
                aria-label={`Select ${gem} token, ${availableCount} remaining in bank`}
                className={`relative flex items-center justify-center p-1 rounded-full transition-transform focus:outline-none ${
                  isStaged ? 'scale-115' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {/* Glowing ring when staged */}
                {isStaged && (
                  <div
                    className="absolute -inset-1.5 rounded-full border-2 border-amber-300 animate-pulse pointer-events-none"
                    style={{
                      boxShadow: `0 0 16px ${TOKEN_COLORS[gem].glow}`,
                    }}
                  />
                )}

                <GemIcon
                  type={gem}
                  size="xl"
                  variant="chip"
                  count={availableCount}
                  selected={isStaged}
                  disabled={disabled || isExhausted}
                  showGlow={isStaged}
                />
              </button>

              {/* Staged Indicator Badge */}
              {isStaged && (
                <div className="absolute -top-1 -left-1 bg-amber-400 text-slate-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-amber-200 animate-bounce z-20">
                  +{stagedCount}
                </div>
              )}
            </div>
          );
        })}

        {/* Gold Joker Coin (Display only - taken via Reserve) */}
        <div className="relative group flex items-center gap-2 pt-1 border-t border-slate-800">
          <div
            className="relative p-1 rounded-full cursor-help"
            title="Gold wildcards are granted when you Reserve a development card."
          >
            <GemIcon
              type="gold"
              size="xl"
              variant="chip"
              count={bank.gold}
              showGlow={false}
            />
          </div>
        </div>
      </div>

      {/* Staged Action Bar (If gems are staged) */}
      {stagedGems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/80 w-full flex flex-col gap-2 items-center animate-fade-in">
          <button
            type="button"
            onClick={onConfirmTake}
            disabled={!isValidCombination || disabled}
            className={`w-full py-1.5 px-2 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1 shadow-lg transition-all ${
              isValidCombination && !disabled
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white cursor-pointer active:scale-95 shadow-emerald-900/50 ring-2 ring-emerald-400'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Check size={14} />
            <span>COLLECT ({stagedGems.length})</span>
          </button>

          <button
            type="button"
            onClick={onClearStaged}
            className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            <span>Clear selection</span>
          </button>

          {!isValidCombination && (
            <p className="text-[10px] text-amber-300 text-center leading-tight max-w-[120px]">
              {validation.reason || 'Select 3 distinct or 2 of same (if 4+ in bank)'}
            </p>
          )}
        </div>
      )}
    </aside>
  );
};
