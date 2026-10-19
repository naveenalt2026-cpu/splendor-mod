import React, { useEffect } from 'react';
import { DevelopmentCard, GameLogEntry, GemType, NobleTile, TokenType, TokenCount } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { GEM_COLORS } from '../game/constants.ts';
import { Sparkles, Coins, Bookmark, Award, ShieldAlert, X } from 'lucide-react';

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

  // Construct card object if available in details
  const card: DevelopmentCard | undefined =
    log.details?.card ||
    (log.details?.cardName
      ? {
          id: log.details.cardId || 'preview_card',
          tier: log.details.cardTier || 1,
          name: log.details.cardName,
          gemBonus: log.details.cardBonus || 'ruby',
          prestigePoints: log.details.prestigePointsGained || 0,
          illustration: log.details.cardIllustration || '💎',
          cost: {},
        }
      : undefined);

  // Construct noble object if available in details
  const noble: NobleTile | undefined =
    log.details?.noble ||
    (log.details?.nobleName
      ? {
          id: 'preview_noble',
          name: log.details.nobleName,
          prestigePoints: log.details.prestigePointsGained || 3,
          requirements: {},
          avatar: '👑',
        }
      : undefined);

  const getActionBadge = () => {
    switch (log.action) {
      case 'buy_card':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold font-['Cinzel'] tracking-wider shadow-sm">
            <Sparkles size={12} className="text-emerald-400" />
            <span>BOUGHT CARD</span>
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

  // Render gem tokens purely as physical glowing chips without text
  const renderGemChips = (tokensMap: Partial<TokenCount>) => {
    const entries = (Object.entries(tokensMap) as [TokenType, number][]).filter(
      ([_, count]) => count && count > 0
    );

    if (entries.length === 0) {
      return (
        <div className="text-xs text-slate-400 italic text-center py-2">
          {log.description}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-3 sm:gap-4 my-2 flex-wrap">
        {entries.map(([token, count]) => {
          const isGold = token === 'gold';
          const gemColor = !isGold ? GEM_COLORS[token as GemType] : null;

          return (
            <div
              key={token}
              className="relative flex items-center justify-center p-3.5 sm:p-4 rounded-2xl border shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: gemColor ? `${gemColor.primary}20` : '#f59e0b25',
                borderColor: gemColor ? `${gemColor.primary}80` : '#f59e0b80',
                boxShadow: gemColor ? `0 0 20px ${gemColor.glow}` : '0 0 20px rgba(245, 158, 11, 0.5)',
              }}
              title={`${count} ${token}`}
            >
              <GemIcon
                type={token}
                size="md"
                variant={isGold ? 'chip' : 'gem'}
                className="w-10 h-10 sm:w-12 sm:h-12 filter drop-shadow-lg"
              />
              {count > 1 && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs border border-amber-200 shadow-md">
                  x{count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActionVisual = () => {
    // 1. Take Tokens: Show the gem images themselves purely as glowing gem chips
    if (log.action === 'take_tokens') {
      const tokensMap = log.details?.tokens || {};
      return renderGemChips(tokensMap);
    }

    // 2. Buy Card: Render the ACTUAL CARD ITSELF!
    if (log.action === 'buy_card') {
      if (card) {
        return (
          <div className="flex items-center justify-center my-1.5">
            <div className="transform hover:scale-105 transition-transform duration-200">
              <DevelopmentCardView
                card={card}
                disabled={false}
                canReserve={false}
                compact={true}
              />
            </div>
          </div>
        );
      }
    }

    // 3. Reserve Card: Render the card itself + Gold token if awarded
    if (log.action === 'reserve_card') {
      return (
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-1.5">
          {card ? (
            <div className="transform hover:scale-105 transition-transform duration-200">
              <DevelopmentCardView
                card={card}
                disabled={false}
                canReserve={false}
                compact={true}
              />
            </div>
          ) : (
            <div className="w-24 sm:w-28 h-36 sm:h-40 rounded-2xl bg-[#121826] border-2 border-sky-400/60 flex flex-col items-center justify-center p-2 shadow-lg">
              <span className="text-3xl mb-1.5 filter drop-shadow">📜</span>
              <span className="font-['Cinzel'] font-bold text-xs text-sky-200">
                Tier {log.details?.cardTier || 1}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                Reserved
              </span>
            </div>
          )}

          {log.details?.goldAwarded && (
            <div
              className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border shadow-lg bg-amber-500/20 border-amber-400/80"
              style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.45)' }}
              title="1 Gold Joker Token awarded"
            >
              <GemIcon type="gold" size="md" variant="chip" className="w-10 h-10 sm:w-12 sm:h-12" />
              <span className="font-mono font-black text-xs text-amber-300 mt-1">+1</span>
            </div>
          )}
        </div>
      );
    }

    // 4. Noble Visit: Render the Noble Tile itself!
    if (log.action === 'noble_visit') {
      if (noble) {
        return (
          <div className="flex items-center justify-center my-1.5">
            <div className="transform hover:scale-105 transition-transform duration-200">
              <NobleTileView noble={noble} compact={true} className="w-36" />
            </div>
          </div>
        );
      }
    }

    // 5. Discard Tokens: Render the discarded gem chips
    if (log.action === 'discard_tokens') {
      const tokensMap = log.details?.tokens || {};
      return renderGemChips(tokensMap);
    }

    // Fallback: description
    return (
      <div className="text-xs text-slate-300 leading-relaxed text-center font-sans bg-[#0B0F1A]/80 p-2.5 rounded-xl border border-white/5 my-2">
        {log.description}
      </div>
    );
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed top-24 sm:top-28 left-1/2 z-50 w-full max-w-sm sm:max-w-md px-4 select-none cursor-pointer animate-action-popup"
      role="alert"
      aria-live="polite"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative rounded-2xl bg-[#121826]/95 border-2 border-amber-400/80 shadow-[0_16px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-xl p-3.5 sm:p-4 text-slate-100 overflow-hidden"
      >
        {/* Animated Top Golden Shimmer Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/10 via-amber-400 to-amber-500/10 animate-pulse" />

        {/* Top Header: Player Avatar, Name, Action Badge, and Close Button */}
        <div className="flex items-center justify-between gap-2.5 mb-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <span className="text-2xl sm:text-3xl filter drop-shadow">{avatar}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#121826] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-200 truncate leading-tight">
                {log.playerName.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Round {log.turn}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {getActionBadge()}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss popup"
              aria-label="Dismiss action popup"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Pure Visual Centerpiece: The Gem Images or The Card Itself */}
        <div className="flex items-center justify-center">{renderActionVisual()}</div>

        {/* Bottom Auto-Dismiss Progress Bar */}
        <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Click to dismiss</span>
          <div className="w-20 sm:w-28 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full animate-action-progress" />
          </div>
        </div>
      </div>
    </div>
  );
};
