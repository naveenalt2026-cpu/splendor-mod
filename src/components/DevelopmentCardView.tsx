import React from 'react';
import { CardAffordability, DevelopmentCard, GemType } from '../types/game.ts';
import { GEM_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Check, X } from 'lucide-react';

interface DevelopmentCardViewProps {
  card: DevelopmentCard;
  affordability?: CardAffordability;
  isSelected?: boolean;
  canReserve?: boolean;
  isReservedCard?: boolean;
  onSelect?: () => void;
  onBuy?: () => void;
  onReserve?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const DevelopmentCardView: React.FC<DevelopmentCardViewProps> = ({
  card,
  affordability,
  isSelected = false,
  canReserve = true,
  isReservedCard = false,
  onSelect,
  onBuy,
  onReserve,
  disabled = false,
  compact = false,
}) => {
  const gemColor = GEM_COLORS[card.gemBonus];
  const canAfford = affordability?.canAfford ?? false;
  const [isConfirmingReserve, setIsConfirmingReserve] = React.useState(false);

  React.useEffect(() => {
    if (!isSelected) {
      setIsConfirmingReserve(false);
    }
  }, [isSelected]);

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-2xl transition-all duration-200 select-none flex flex-col justify-between overflow-hidden ${
        compact
          ? 'w-24 sm:w-28 h-36 sm:h-40 p-2'
          : 'w-28 sm:w-32 md:w-36 lg:w-[150px] h-44 sm:h-48 md:h-52 p-2.5 sm:p-3'
      } bg-[#121826] border border-white/8 shadow-md hover:shadow-xl hover:border-white/20 ${
        isSelected
          ? 'ring-2 ring-amber-400 scale-[1.03] z-30 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
          : canAfford
          ? 'ring-1.5 ring-emerald-500/70 hover:ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] cursor-pointer'
          : 'hover:scale-[1.01] cursor-pointer'
      } ${disabled ? 'opacity-40 grayscale-[40%] pointer-events-none' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${card.name}, Tier ${card.tier}, ${card.prestigePoints} Prestige Points, provides ${card.gemBonus} bonus`}
    >
      {/* Top Header: Prestige Points on Left, Gem Bonus Crest on Right */}
      <div className="flex items-center justify-between z-10">
        {card.prestigePoints > 0 ? (
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <span className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base leading-none">
              {card.prestigePoints}
            </span>
            <span className="text-[9px] text-amber-400 font-bold leading-none">VP</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-500 font-semibold px-1">
            T{card.tier}
          </span>
        )}

        {/* Permanent Gem Bonus Crest */}
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-white/10 shadow-sm"
          style={{
            backgroundColor: `${gemColor.primary}20`,
            boxShadow: `0 0 10px ${gemColor.glow}`,
          }}
          title={`Permanent +1 ${gemColor.name} discount`}
        >
          <GemIcon type={card.gemBonus} size="xs" variant="gem" />
        </div>
      </div>

      {/* Center: Large illustration & readable 2-line title */}
      <div className="flex flex-col items-center justify-center my-auto py-1 z-10 text-center">
        <div className="text-3xl sm:text-4xl filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-200">
          {card.illustration}
        </div>
        <div className="font-['Cinzel'] font-semibold text-[11px] sm:text-xs text-slate-200 line-clamp-2 mt-1.5 px-1 leading-snug">
          {card.name}
        </div>
      </div>

      {/* Bottom: Cost gems in a clean, aligned row */}
      <div className="flex items-center justify-center gap-1 z-10 pt-1.5 border-t border-white/5">
        {(Object.entries(card.cost) as [GemType, number][]).map(([gem, cost]) => {
          if (!cost || cost <= 0) return null;
          const userBonus = affordability?.bonuses[gem] || 0;
          const isCovered = userBonus >= cost;

          return (
            <div
              key={gem}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                isCovered
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-[#0B0F1A] border-white/10 text-slate-200'
              }`}
              title={`${cost} ${gem} required (${userBonus} covered by permanent discount)`}
            >
              <GemIcon type={gem} size="xs" variant="gem" />
              <span className="font-mono">{cost}</span>
            </div>
          );
        })}
      </div>

      {/* Subtle green highlight when affordable */}
      {canAfford && !isSelected && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      )}

      {/* Overlay action sheet when selected */}
      {isSelected && onBuy && (
        <div
          className="absolute inset-0 bg-[#0B0F1A]/95 backdrop-blur-sm p-2 flex flex-col justify-between items-center z-20 animate-fade-in"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center mt-1">
            <span className="font-['Cinzel'] font-bold text-xs text-amber-200 block truncate">
              {card.name}
            </span>
            <span className="text-[10px] text-slate-400">
              +{card.prestigePoints} VP • +1 {gemColor.name}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <button
              type="button"
              onClick={onBuy}
              disabled={!canAfford}
              className={`w-full py-1.5 rounded-xl font-['Cinzel'] font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <span>Buy Card</span>
              {affordability && affordability.goldNeeded > 0 && (
                <span className="text-[10px] text-amber-900 font-sans">({affordability.goldNeeded} gold)</span>
              )}
            </button>

            {!isReservedCard && onReserve && (
              isConfirmingReserve ? (
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingReserve(false);
                      onReserve();
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Check size={12} />
                    <span>Confirm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReserve(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingReserve(true)}
                  disabled={!canReserve}
                  className={`w-full py-1.5 rounded-xl font-['Cinzel'] font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                    canReserve
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer active:scale-95'
                      : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <span>Reserve</span>
                  <span className="text-[10px] text-amber-400 font-sans">(+1 Gold)</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
