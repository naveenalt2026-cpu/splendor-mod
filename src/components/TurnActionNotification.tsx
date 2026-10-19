import React, { useEffect } from 'react';
import { GameLogEntry, GemType, TokenType } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';
import { GEM_COLORS } from '../game/constants.ts';
import { Sparkles, Coins, Bookmark, Award, ShieldAlert, X, Crown, ArrowRight } from 'lucide-react';

interface TurnActionNotificationProps {
  log: GameLogEntry;
  playerAvatar?: string;
  onDismiss: () => void;
}

export const TurnActionNotification: React.FC<TurnActionNotificationProps> = ({
  log,
  playerAvatar,
  onDismiss,
}) => {
  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [log.id, onDismiss]);

  const avatar = playerAvatar || log.details?.playerAvatar || '👑';

  const getActionBadge = () => {
    switch (log.action) {
      case 'buy_card':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <Sparkles size={12} className="text-emerald-400" />
            <span>CARD PURCHASED</span>
          </div>
        );
      case 'take_tokens':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <Coins size={12} className="text-amber-400" />
            <span>COLLECTED TOKENS</span>
          </div>
        );
      case 'reserve_card':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <Bookmark size={12} className="text-sky-400" />
            <span>RESERVED CARD</span>
          </div>
        );
      case 'noble_visit':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/25 border border-yellow-400/60 text-yellow-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <Award size={12} className="text-yellow-400" />
            <span>NOBLE PATRON VISIT</span>
          </div>
        );
      case 'discard_tokens':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <ShieldAlert size={12} className="text-rose-400" />
            <span>RETURNED TOKENS</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <span>ACTION COMPLETE</span>
          </div>
        );
    }
  };

  const renderActionContent = () => {
    // 1. Take Tokens action details
    if (log.action === 'take_tokens') {
      const tokensMap = log.details?.tokens;
      if (tokensMap && Object.keys(tokensMap).length > 0) {
        return (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">
              Collected from the Gem Bank:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(Object.entries(tokensMap) as [TokenType, number][]).map(([token, count]) => {
                if (!count || count <= 0) return null;
                const isGold = token === 'gold';
                const gemColor = !isGold ? GEM_COLORS[token as GemType] : null;

                return (
                  <div
                    key={token}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-[#0B0F1A] border-white/10 shadow-sm"
                    style={
                      gemColor
                        ? {
                            borderColor: `${gemColor.primary}50`,
                            backgroundColor: `${gemColor.primary}15`,
                          }
                        : undefined
                    }
                  >
                    <GemIcon
                      type={token}
                      size="sm"
                      variant={isGold ? 'chip' : 'gem'}
                      className="w-5 h-5"
                    />
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-sm font-black text-white">+{count}</span>
                      <span className="text-xs text-slate-300 capitalize font-medium">{token}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }

    // 2. Buy Card action details
    if (log.action === 'buy_card') {
      const { cardName, cardTier, cardBonus, cardIllustration, prestigePointsGained } =
        log.details || {};
      const gemColor = cardBonus ? GEM_COLORS[cardBonus] : null;

      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">
            Acquired into personal empire:
          </span>
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0B0F1A] border border-white/10 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Card Illustration */}
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm">
                {cardIllustration || '💎'}
              </div>

              <div className="min-w-0">
                <div className="font-['Cinzel'] font-bold text-sm text-slate-100 truncate">
                  {cardName || 'Development Card'}
                </div>
                {cardTier && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tier {cardTier} Card
                  </div>
                )}
              </div>
            </div>

            {/* Rewards: Bonus Gem & VP */}
            <div className="flex items-center gap-2 shrink-0">
              {cardBonus && gemColor && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: `${gemColor.primary}20`,
                    borderColor: `${gemColor.primary}60`,
                  }}
                  title={`Permanent +1 ${cardBonus} discount`}
                >
                  <GemIcon type={cardBonus} size="xs" variant="gem" className="w-4 h-4" />
                  <span className="font-mono font-bold text-xs text-white">+1 Bonus</span>
                </div>
              )}

              {typeof prestigePointsGained === 'number' && prestigePointsGained > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-['Cinzel'] font-black text-xs shadow-sm">
                  <Crown size={12} className="text-amber-400" />
                  <span>+{prestigePointsGained} VP</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 3. Reserve Card action details
    if (log.action === 'reserve_card') {
      const { cardName, cardTier, cardIllustration, goldAwarded } = log.details || {};

      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">
            Saved to hand for later construction:
          </span>
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0B0F1A] border border-white/10 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-lg shrink-0">
                {cardIllustration || '📜'}
              </div>
              <div className="min-w-0">
                <div className="font-['Cinzel'] font-bold text-xs sm:text-sm text-slate-100 truncate">
                  {cardName || `Tier ${cardTier || 1} Deck Card`}
                </div>
                <div className="text-[10px] text-sky-400 font-mono">
                  Reserved in Hand
                </div>
              </div>
            </div>

            {goldAwarded && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 shadow-sm shrink-0">
                <GemIcon type="gold" size="xs" variant="chip" className="w-4 h-4" />
                <span className="font-mono font-bold text-xs text-amber-300">+1 Gold Joker</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Noble visit details
    if (log.action === 'noble_visit') {
      const { nobleName, prestigePointsGained } = log.details || {};
      return (
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="text-amber-400 shrink-0" size={20} />
            <div className="min-w-0">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-['Cinzel'] block">
                Noble Patron Visit
              </span>
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-amber-100 truncate block">
                {nobleName || 'Royal Sovereign'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-200 font-['Cinzel'] font-black text-sm shrink-0">
            <Crown size={14} className="text-amber-400" />
            <span>+{prestigePointsGained || 3} VP</span>
          </div>
        </div>
      );
    }

    // 5. Discard Tokens details
    if (log.action === 'discard_tokens') {
      const { discardedCount } = log.details || {};
      return (
        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
          <ShieldAlert size={16} className="text-rose-400 shrink-0" />
          <span>Returned {discardedCount || 'excess'} tokens back to the gem bank.</span>
        </div>
      );
    }

    // Default Fallback: Raw description
    return (
      <div className="text-xs text-slate-300 leading-relaxed font-sans bg-[#0B0F1A]/80 p-2.5 rounded-xl border border-white/5">
        {log.description}
      </div>
    );
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed top-24 sm:top-28 left-1/2 z-50 w-full max-w-lg px-4 select-none cursor-pointer animate-action-popup"
      role="alert"
      aria-live="polite"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative rounded-2xl bg-[#121826]/95 border-2 border-amber-400/80 shadow-[0_16px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-xl p-4 sm:p-5 text-slate-100 overflow-hidden"
      >
        {/* Animated Top Golden Shimmer Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/10 via-amber-400 to-amber-500/10 animate-pulse" />

        {/* Top Header: Player Avatar, Name, Action Badge, and Close Button */}
        <div className="flex items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="text-3xl filter drop-shadow">{avatar}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#121826] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="font-['Cinzel'] font-black text-sm sm:text-base text-amber-200 truncate leading-tight">
                {log.playerName.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Round {log.turn} Action
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {getActionBadge()}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss popup"
              aria-label="Dismiss action popup"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action Details Body */}
        <div className="mb-3">{renderActionContent()}</div>

        {/* Bottom Auto-Dismiss Progress Bar */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Click anywhere to dismiss</span>
          <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-action-progress" />
          </div>
        </div>
      </div>
    </div>
  );
};
