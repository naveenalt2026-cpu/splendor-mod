import React from 'react';
import { GemCount, GemType, NobleTile } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';

interface NobleTileViewProps {
  noble: NobleTile;
  playerBonuses?: GemCount;
  compact?: boolean;
  className?: string;
}

export const NobleTileView: React.FC<NobleTileViewProps> = ({
  noble,
  playerBonuses,
  compact = false,
  className = '',
}) => {
  const isSatisfied = playerBonuses
    ? (Object.entries(noble.requirements) as [GemType, number][]).every(
        ([gem, count]) => (playerBonuses[gem] || 0) >= count
      )
    : false;

  const reqEntries = Object.entries(noble.requirements) as [GemType, number][];

  return (
    <div
      className={`relative rounded-2xl transition-all duration-200 select-none flex flex-col justify-between shrink-0 ${
        compact
          ? 'w-full min-h-[118px] p-2'
          : 'w-28 sm:w-32 min-h-[148px] sm:min-h-[156px] p-2.5 sm:p-3'
      } bg-[#121826] border shadow-md ${
        isSatisfied
          ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
          : 'border-white/8 hover:border-white/20'
      } ${className}`}
      title={`${noble.name}: awards ${noble.prestigePoints} Prestige Points. Requirements: ${reqEntries
        .map(([g, c]) => `${c} ${g}`)
        .join(', ')}`}
    >
      {/* Top: 3 VP crest and Noble Avatar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <span className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base leading-none">
              {noble.prestigePoints}
            </span>
            <span className="text-[9px] text-amber-400 font-bold leading-none">VP</span>
          </div>

          <div className="text-xl sm:text-2xl filter drop-shadow leading-none">
            {noble.avatar}
          </div>
        </div>

        {/* Short noble name */}
        <div className="text-[11px] font-['Cinzel'] font-bold text-slate-200 truncate text-center mb-2">
          {noble.name.split(' ')[0]}
        </div>
      </div>

      {/* Gem requirements list */}
      <div className="flex flex-col gap-1 w-full mt-auto pt-1 border-t border-white/5">
        {reqEntries.map(([gem, count]) => {
          const currentBonus = playerBonuses ? playerBonuses[gem] || 0 : 0;
          const met = currentBonus >= count;

          return (
            <div
              key={gem}
              className={`flex items-center justify-between px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors ${
                met
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                  : 'bg-[#0B0F1A] border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <GemIcon type={gem} size="xs" variant="gem" className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-mono text-white text-xs sm:text-sm font-black">{count}</span>
              </div>
              {playerBonuses && (
                <span
                  className={`text-[10px] font-mono ${
                    met ? 'text-emerald-400 font-black' : 'text-slate-500'
                  }`}
                >
                  {currentBonus}/{count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isSatisfied && (
        <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-amber-100 animate-bounce">
          CLAIM!
        </div>
      )}
    </div>
  );
};
