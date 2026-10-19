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

  // Tier border styling & metallic sheen
  const tierBorder =
    card.tier === 3
      ? 'border-amber-400 shadow-[0_4px_16px_rgba(251,191,36,0.35)]'
      : card.tier === 2
      ? 'border-sky-400 shadow-[0_4px_14px_rgba(56,189,248,0.3)]'
      : 'border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.25)]';

  const tierGlow =
    card.tier === 3
      ? 'from-amber-950/40 via-slate-900/90 to-slate-950'
      : card.tier === 2
      ? 'from-sky-950/40 via-slate-900/90 to-slate-950'
      : 'from-emerald-950/40 via-slate-900/90 to-slate-950';

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-xl border-2 transition-all duration-300 select-none ${tierBorder} bg-gradient-to-b ${tierGlow} ${
        compact ? 'w-24 h-32 shrink-0' : 'w-28 sm:w-32 md:w-36 lg:w-40 h-40 sm:h-44 md:h-48 shrink-0'
      } ${
        isSelected
          ? 'scale-110 z-40 ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.9)] -translate-y-2'
          : canAfford
          ? 'hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_22px_rgba(52,211,153,0.6)] cursor-pointer'
          : 'hover:scale-102 hover:shadow-lg cursor-pointer'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${card.name}, Tier ${card.tier}, ${card.prestigePoints} Prestige Points, provides ${card.gemBonus} bonus`}
    >
      {/* Top Header: Prestige Points on Left, Gem Bonus Crest on Right */}
      <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
        {/* Prestige Points */}
        {card.prestigePoints > 0 ? (
          <div className="font-['Cinzel'] font-black text-amber-300 text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center">
            <span>{card.prestigePoints}</span>
            <span className="text-[10px] text-amber-200/90 font-bold ml-0.5">VP</span>
          </div>
        ) : (
          <div />
        )}

        {/* Permanent Gem Bonus Circle */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center p-0.5 border-2 border-amber-300 shadow-lg"
          style={{
            backgroundColor: 'rgba(3, 7, 18, 0.95)',
            boxShadow: `0 0 12px ${gemColor.glow}`,
          }}
          title={`Permanent +1 ${gemColor.name} bonus`}
        >
          <GemIcon type={card.gemBonus} size="sm" variant="gem" />
        </div>
      </div>

      {/* Renaissance Painting Central Window */}
      <div className="absolute inset-x-2 top-8 bottom-12 rounded-lg overflow-hidden border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950 to-black flex flex-col items-center justify-center shadow-inner group-hover:brightness-110 transition-all">
        {/* Radial gem atmosphere glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${gemColor.primary} 0%, transparent 75%)`,
          }}
        />

        {/* Illustration Icon */}
        <div className="text-3xl sm:text-4xl filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.9)] transform group-hover:scale-115 transition-transform duration-300 z-10">
          {card.illustration}
        </div>

        {/* Card Name Banner */}
        <div className="absolute bottom-1 inset-x-1 text-center font-['Cinzel'] text-[10px] sm:text-[11px] text-amber-100 font-bold truncate z-10 px-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
          {card.name}
        </div>
      </div>

      {/* Bottom Cost Disc Pips (Grouped neatly at bottom) */}
      <div className="absolute bottom-1.5 left-2 right-2 flex flex-wrap items-center gap-1 z-20 pointer-events-none">
        {(Object.entries(card.cost) as [GemType, number][]).map(([gem, cost]) => {
          if (!cost || cost <= 0) return null;
          const userBonus = affordability?.bonuses[gem] || 0;
          const effectiveCost = Math.max(0, cost - userBonus);
          const isSatisfied = effectiveCost === 0;

          return (
            <div
              key={gem}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-black shadow transition-colors ${
                isSatisfied
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                  : 'bg-black/90 border-slate-700 text-slate-100'
              }`}
              title={`${cost} ${gem} required (${userBonus} covered by permanent engine)`}
            >
              <GemIcon type={gem} size="xs" variant="gem" />
              <span>{cost}</span>
            </div>
          );
        })}
      </div>

      {/* Green pulsating halo when affordable */}
      {canAfford && !isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/80 pointer-events-none animate-pulse" />
      )}

      {/* Action Overlay when Selected (Matching Reference Screenshot) */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-xl bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-2 z-40 animate-fade-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Card Title */}
          <div className="text-center px-1">
            <span className="font-['Cinzel'] font-bold text-amber-200 text-xs block leading-tight">
              {card.name}
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              +{card.prestigePoints} VP • +1 {gemColor.name}
            </span>
          </div>

          {/* Action Buttons: BUY and RESERVE tablets */}
          <div className="flex flex-col gap-1.5 w-full mt-1">
            <button
              type="button"
              onClick={onBuy}
              disabled={!canAfford}
              className={`w-full py-1.5 px-2 rounded-lg font-['Cinzel'] font-bold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-1 ${
                canAfford
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white cursor-pointer active:scale-95 shadow-emerald-950/80 ring-2 ring-emerald-300'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>BUY</span>
              {affordability && affordability.goldNeeded > 0 && (
                <span className="text-[10px] text-amber-300">({affordability.goldNeeded} gold)</span>
              )}
            </button>

            {!isReservedCard && (
              isConfirmingReserve ? (
                <div className="flex items-center gap-1 w-full animate-fade-in">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setIsConfirmingReserve(false);
                      onReserve && onReserve();
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-['Cinzel'] font-black text-[11px] tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ring-2 ring-amber-300"
                    title="Confirm reserving this card into your private hand"
                    aria-label={`Confirm reserve ${card.name}`}
                  >
                    <Check size={13} className="text-slate-950 stroke-[3]" />
                    <span>CONFIRM?</span>
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setIsConfirmingReserve(false);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-['Cinzel'] text-xs flex items-center justify-center shadow transition-all cursor-pointer"
                    title="Cancel"
                    aria-label="Cancel reserve"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setIsConfirmingReserve(true);
                  }}
                  disabled={!canReserve}
                  className={`w-full py-1.5 px-2 rounded-lg font-['Cinzel'] font-bold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-1 ${
                    canReserve
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-amber-100 cursor-pointer active:scale-95 shadow-amber-950/80 ring-2 ring-amber-400'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>RESERVE</span>
                  <span className="text-[10px] text-amber-300">(+1 Gold)</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
