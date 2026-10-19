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
  className?: string;
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
  className = '',
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
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`relative group rounded-2xl transition-all duration-200 select-none flex flex-col justify-between overflow-hidden ${
        compact
          ? 'w-24 sm:w-28 h-40 sm:h-44 p-2'
          : 'w-28 sm:w-30 md:w-32 lg:w-[134px] xl:w-[140px] h-48 sm:h-52 md:h-56 lg:h-[216px] xl:h-[224px] p-2.5 sm:p-3'
      } bg-gradient-to-b from-[#1A2538] via-[#141D2C] to-[#0E1522] border border-white/12 shadow-lg hover:border-white/25 ${
        isSelected
          ? 'ring-2 ring-amber-400 scale-[1.03] z-30 shadow-[0_0_25px_rgba(245,158,11,0.35)] cursor-pointer'
          : canAfford
          ? 'ring-1.5 ring-emerald-500/70 hover:ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] cursor-pointer'
          : 'hover:scale-[1.01] cursor-pointer'
      } ${disabled ? 'opacity-40 grayscale-[40%] pointer-events-none' : ''} ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`${card.name}, Tier ${card.tier}, ${card.prestigePoints} Prestige Points, provides ${card.gemBonus} bonus`}
    >
      {/* Top Header: Prestige Points on Left, Large Gem Bonus Crest on Right */}
      <div className="flex items-center justify-between z-10">
        {card.prestigePoints > 0 ? (
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <span className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base leading-none">
              {card.prestigePoints}
            </span>
            <span className="text-[9px] text-amber-400 font-bold leading-none">VP</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 py-0.5 rounded bg-white/5">
            T{card.tier}
          </span>
        )}

        {/* Large Permanent Gem Bonus Crest (Discount Gem) */}
        <div
          className="flex items-center justify-center p-1 rounded-xl border shadow-md transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${gemColor.primary}25`,
            borderColor: `${gemColor.primary}60`,
            boxShadow: `0 0 12px ${gemColor.glow}`,
          }}
          title={`Permanent +1 discount`}
        >
          <GemIcon type={card.gemBonus} size="sm" variant="gem" />
        </div>
      </div>

      {/* Center: Refined illustration & readable title */}
      <div className="flex flex-col items-center justify-center my-auto py-1 z-10 text-center">
        <div className="text-2xl sm:text-3xl filter drop-shadow transform group-hover:scale-110 transition-transform duration-200">
          {card.illustration}
        </div>
        <div className="font-['Cinzel'] font-medium text-[10px] sm:text-[11px] text-slate-300 line-clamp-1 mt-1.5 px-1 leading-tight">
          {card.name}
        </div>
      </div>

      {/* Bottom: Cost gems with larger gem icons & bold requirement numbers */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 z-10 pt-1.5 border-t border-white/5 flex-wrap">
        {(Object.entries(card.cost) as [GemType, number][]).map(([gem, cost]) => {
          if (!cost || cost <= 0) return null;
          const userBonus = affordability?.bonuses[gem] || 0;
          const isCovered = userBonus >= cost;

          return (
            <div
              key={gem}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shadow-xs transition-colors ${
                isCovered
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                  : 'bg-[#0B0F1A] border-white/10 text-white'
              }`}
              title={`${cost} required`}
            >
              <GemIcon type={gem} size="xs" variant="gem" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-mono font-black text-xs sm:text-sm">{cost}</span>
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
          className="absolute inset-0 bg-[#0B0F1A]/95 backdrop-blur-sm p-2 flex flex-col justify-between items-center z-20 animate-fade-in cursor-pointer select-none"
          onClick={e => {
            e.stopPropagation();
            onSelect?.();
          }}
          title="Click card to flip back"
        >
          {/* Top-right flip back / close button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full text-slate-400 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer z-30"
            title="Flip back"
            aria-label="Flip back"
          >
            <X size={12} />
          </button>

          <div className="text-center mt-1 px-4">
            <span className="font-['Cinzel'] font-bold text-xs text-amber-200 block truncate">
              {card.name}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-amber-300 font-bold">+{card.prestigePoints} VP</span>
              <span className="text-[10px] text-slate-500">•</span>
              <GemIcon type={card.gemBonus} size="xs" variant="gem" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                if (canAfford) {
                  onBuy();
                } else {
                  onSelect?.();
                }
              }}
              className={`w-full py-1.5 rounded-xl font-['Cinzel'] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
              }`}
              title={canAfford ? 'Buy this card' : 'Cannot afford yet — click to flip back'}
            >
              <span>Buy Card</span>
              {affordability && affordability.goldNeeded > 0 && (
                <span className="text-[10px] text-amber-400/90 font-sans">({affordability.goldNeeded} gold)</span>
              )}
            </button>

            {!isReservedCard && onReserve && (
              isConfirmingReserve ? (
                <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
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
                    onClick={e => {
                      e.stopPropagation();
                      setIsConfirmingReserve(false);
                    }}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    if (canReserve) {
                      setIsConfirmingReserve(true);
                    } else {
                      onSelect?.();
                    }
                  }}
                  className={`w-full py-1.5 rounded-xl font-['Cinzel'] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    canReserve
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-slate-600 border border-white/5'
                  }`}
                  title={canReserve ? 'Reserve this card (+1 Gold)' : 'Reserve limit reached (3/3)'}
                >
                  <span>Reserve</span>
                  <span className="text-[10px] text-amber-400 font-sans">(+1 Gold)</span>
                </button>
              )
            )}

            {!compact && (
              <div className="text-center pt-0.5">
                <span className="text-[9px] text-slate-500 hover:text-slate-300 font-['Cinzel'] tracking-wider">
                  Tap card to flip back
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
