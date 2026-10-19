import React from 'react';
import { GemCount, GemType, NobleTile } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';
import { NoblePortrait } from './NoblePortrait.tsx';

interface NobleTileViewProps {
  noble: NobleTile;
  playerBonuses?: GemCount;
  compact?: boolean;
  className?: string;
}

const getShortName = (fullName: string) => {
  const parts = fullName.split(' ');
  if (parts.length >= 2 && (parts[1] === 'I' || parts[1] === 'V' || parts[1] === 'VIII' || parts[1] === 'II')) {
    return `${parts[0]} ${parts[1]}`;
  }
  if (fullName.startsWith('Mary Stuart')) return 'Mary Stuart';
  return parts[0];
};

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
  const shortName = getShortName(noble.name);

  return (
    <div
      className={`relative rounded-2xl transition-all duration-200 select-none flex flex-col justify-between overflow-hidden ${
        compact
          ? 'w-full max-w-[170px] min-h-[160px] sm:min-h-[170px] p-2 sm:p-2.5'
          : 'w-26 sm:w-30 min-h-[175px] p-2.5'
      } bg-[#121826] border shadow-md ${
        isSatisfied
          ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
          : 'border-white/8 hover:border-white/20'
      } ${className}`}
      title={`${noble.name}: awards ${noble.prestigePoints} Prestige Points. Requirements: ${reqEntries
        .map(([g, c]) => `${c} ${g}`)
        .join(', ')}`}
    >
      {/* Top Header: 3 VP Prestige Crest on Left & Regnal Name on Right */}
      <div className="flex items-center justify-between mb-1.5 z-10 px-0.5">
        <div className="flex items-baseline gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 shrink-0">
          <span className="font-['Cinzel'] font-black text-amber-300 text-xs sm:text-sm leading-none">
            {noble.prestigePoints}
          </span>
          <span className="text-[8px] text-amber-400 font-bold leading-none">VP</span>
        </div>

        <div className="text-[11px] font-['Cinzel'] font-black text-amber-100 uppercase tracking-wide truncate max-w-[95px] text-right">
          {shortName}
        </div>
      </div>

      {/* Center: Renaissance Cameo Portrait Illustration (Taller portrait) */}
      <div className="my-auto py-0.5 w-full flex items-center justify-center">
        <NoblePortrait
          nobleId={noble.id}
          name={noble.name}
          className={compact ? 'h-16 sm:h-18 w-full' : 'h-20 sm:h-22 w-full'}
        />
      </div>

      {/* Bottom: Compact Requirement Chips in a Clean Aligned Row */}
      <div className="flex items-center justify-center gap-1.5 pt-1.5 border-t border-white/5 flex-wrap z-10">
        {reqEntries.map(([gem, count]) => {
          const currentBonus = playerBonuses ? playerBonuses[gem] || 0 : 0;
          const met = currentBonus >= count;

          return (
            <div
              key={gem}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shadow-xs transition-colors ${
                met
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                  : 'bg-[#0B0F1A] border-white/10 text-white'
              }`}
              title={`${count} ${gem} bonuses required`}
            >
              <GemIcon type={gem} size="xs" variant="gem" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-mono text-white text-xs sm:text-sm font-black">{count}</span>
              {playerBonuses && (
                <span
                  className={`text-[9px] font-mono ${
                    met ? 'text-emerald-400 font-black' : 'text-slate-500'
                  }`}
                >
                  ({currentBonus})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isSatisfied && (
        <div className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-amber-100 animate-bounce z-20">
          CLAIM!
        </div>
      )}
    </div>
  );
};
