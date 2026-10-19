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

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 select-none overflow-hidden ${
        compact ? 'w-20 h-24 p-1.5' : 'w-24 sm:w-28 h-28 sm:h-32 p-2'
      } ${
        isSatisfied
          ? 'border-amber-300 bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-105 ring-2 ring-amber-400'
          : 'border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-md hover:border-slate-500'
      }`}
      title={`${noble.name}: awards ${noble.prestigePoints} Prestige Points when requirements are met.`}
    >
      {/* Ornate corner filigree border accent */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

      {/* Top row: 3 VP and Avatar */}
      <div className="flex items-center justify-between mb-1">
        <div className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base drop-shadow-md flex items-center">
          {noble.prestigePoints}
          <span className="text-[9px] text-amber-200/70 font-normal ml-0.5">VP</span>
        </div>
        <div className="text-xl sm:text-2xl filter drop-shadow-md">{noble.avatar}</div>
      </div>

      {/* Noble Name */}
      <div className="text-[10px] font-['Cinzel'] font-bold text-amber-100/90 truncate text-center mb-1.5">
        {noble.name.split(' ')[0]}
      </div>

      {/* Requirements List with Progress */}
      <div className="flex flex-col gap-1">
        {(Object.entries(noble.requirements) as [GemType, number][]).map(([gem, count]) => {
          const currentBonus = playerBonuses ? playerBonuses[gem] || 0 : 0;
          const met = currentBonus >= count;

          return (
            <div
              key={gem}
              className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                met
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                  : 'bg-black/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <GemIcon type={gem} size="xs" variant="gem" />
                <span>{count}</span>
              </div>
              {playerBonuses && (
                <span className={`text-[9px] ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
                  ({currentBonus}/{count})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isSatisfied && (
        <div className="absolute top-1 right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-full shadow-md animate-bounce">
          READY!
        </div>
      )}
    </div>
  );
};
