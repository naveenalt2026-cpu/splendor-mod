import React from 'react';
import { GemCount, GemType, NobleTile } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';

interface NobleTileViewProps {
  noble: NobleTile;
  playerBonuses?: GemCount;
  compact?: boolean;
}

export const NobleTileView: React.FC<NobleTileViewProps> = ({
  noble,
  playerBonuses,
  compact = false,
}) => {
  // Check if player satisfies requirements
  const isSatisfied = playerBonuses
    ? (Object.entries(noble.requirements) as [GemType, number][]).every(
        ([gem, count]) => (playerBonuses[gem] || 0) >= count
      )
    : false;

  const reqEntries = Object.entries(noble.requirements) as [GemType, number][];

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 select-none flex flex-col justify-between shrink-0 ${
        compact
          ? 'w-24 min-h-[135px] p-2'
          : 'w-28 sm:w-32 min-h-[152px] sm:min-h-[160px] p-2.5'
      } ${
        isSatisfied
          ? 'border-amber-300 bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-[1.02] ring-2 ring-amber-400'
          : 'border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-md hover:border-slate-500'
      }`}
      title={`${noble.name}: awards ${noble.prestigePoints} Prestige Points. Requirements: ${reqEntries
        .map(([g, c]) => `${c} ${g}`)
        .join(', ')}`}
    >
      {/* Ornate corner filigree border accent */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

      {/* Header: 3 VP and Avatar */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <div className="font-['Cinzel'] font-black text-amber-300 text-base sm:text-lg drop-shadow-md flex items-center leading-none">
            {noble.prestigePoints}
            <span className="text-[10px] text-amber-200/80 font-normal ml-0.5">VP</span>
          </div>
          <div className="text-xl sm:text-2xl filter drop-shadow-md leading-none">{noble.avatar}</div>
        </div>

        {/* Noble Name */}
        <div className="text-[10px] sm:text-[11px] font-['Cinzel'] font-bold text-amber-100/90 truncate text-center mb-2">
          {noble.name.split(' ')[0]}
        </div>
      </div>

      {/* Requirements List with Progress - fully visible */}
      <div className="flex flex-col gap-1.5 w-full mt-auto">
        {reqEntries.map(([gem, count]) => {
          const currentBonus = playerBonuses ? playerBonuses[gem] || 0 : 0;
          const met = currentBonus >= count;

          return (
            <div
              key={gem}
              className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-bold border transition-colors shadow-xs ${
                met
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-black/70 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <GemIcon type={gem} size="xs" variant="gem" />
                <span className="font-['Cinzel'] font-black text-xs text-white">
                  {count}
                </span>
              </div>
              {playerBonuses && (
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    met ? 'text-emerald-400' : 'text-slate-400'
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
        <div className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] border border-amber-100 animate-bounce">
          CLAIM!
        </div>
      )}
    </div>
  );
};
