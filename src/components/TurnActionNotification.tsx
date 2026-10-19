import React, { useEffect } from 'react';
import { DevelopmentCard, GameLogEntry, GemType, NobleTile, TokenType, TokenCount } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { GEM_COLORS } from '../game/constants.ts';
import { Sparkles, Coins, Bookmark, Crown, Award, ShieldAlert, X, Zap } from 'lucide-react';

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
  // Auto-dismiss after 3.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3800);
    return () => clearTimeout(timer);
  }, [log.id, onDismiss]);

  const avatar = playerAvatar || log.details?.playerAvatar || '👑';

  // Reconstruct card object if available in details
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

  // Reconstruct noble object if available in details
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

  const getActionTheme = () => {
    switch (log.action) {
      case 'buy_card':
        return {
          title: 'ACQUIRED CARD',
          subtitle: 'Development Card added to tableau',
          icon: <Sparkles size={14} className="text-emerald-400" />,
          badgeBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
          glowColor: 'rgba(16, 185, 129, 0.35)',
          accentGradient: 'from-emerald-500 via-teal-400 to-emerald-500',
        };
      case 'take_tokens':
        return {
          title: 'COLLECTED GEMS',
          subtitle: 'Drawn from the central bank',
          icon: <Coins size={14} className="text-amber-400" />,
          badgeBg: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
          glowColor: 'rgba(245, 158, 11, 0.35)',
          accentGradient: 'from-amber-400 via-yellow-300 to-amber-500',
        };
      case 'reserve_card':
        return {
          title: 'RESERVED BLUEPRINT',
          subtitle: 'Card reserved in private hand',
          icon: <Bookmark size={14} className="text-sky-400" />,
          badgeBg: 'bg-sky-500/20 border-sky-400/50 text-sky-300',
          glowColor: 'rgba(56, 189, 248, 0.35)',
          accentGradient: 'from-sky-400 via-cyan-300 to-sky-500',
        };
      case 'noble_visit':
        return {
          title: 'NOBLE PATRONAGE',
          subtitle: 'A regal noble joined the court',
          icon: <Award size={14} className="text-amber-300" />,
          badgeBg: 'bg-yellow-500/25 border-yellow-400/60 text-yellow-300',
          glowColor: 'rgba(251, 191, 36, 0.45)',
          accentGradient: 'from-amber-400 via-yellow-200 to-amber-400',
        };
      case 'discard_tokens':
        return {
          title: 'RETURNED GEMS',
          subtitle: 'Vault capacity managed',
          icon: <ShieldAlert size={14} className="text-rose-400" />,
          badgeBg: 'bg-rose-500/20 border-rose-400/50 text-rose-300',
          glowColor: 'rgba(244, 63, 94, 0.35)',
          accentGradient: 'from-rose-500 via-pink-400 to-rose-500',
        };
      default:
        return {
          title: 'ACTION COMPLETE',
          subtitle: 'Turn executed successfully',
          icon: <Zap size={14} className="text-amber-400" />,
          badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
          glowColor: 'rgba(245, 158, 11, 0.25)',
          accentGradient: 'from-amber-400 via-amber-300 to-amber-500',
        };
    }
  };

  const theme = getActionTheme();

  // Render glowing 3D-styled Gem Plinths
  const renderGemPlinths = (tokensMap: Partial<TokenCount>) => {
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
      <div className="flex items-center justify-center gap-3 sm:gap-4 my-3 flex-wrap">
        {entries.map(([token, count], idx) => {
          const isGold = token === 'gold';
          const gemColor = !isGold ? GEM_COLORS[token as GemType] : null;

          return (
            <div
              key={token}
              className="relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 animate-gem-float shadow-xl"
              style={{
                backgroundColor: gemColor ? `${gemColor.primary}22` : '#f59e0b25',
                borderColor: gemColor ? `${gemColor.primary}90` : '#f59e0b90',
                boxShadow: gemColor
                  ? `0 0 25px ${gemColor.glow}, inset 0 0 15px ${gemColor.primary}20`
                  : '0 0 25px rgba(245, 158, 11, 0.5), inset 0 0 15px rgba(245, 158, 11, 0.2)',
                animationDelay: `${idx * 150}ms`,
              }}
            >
              <GemIcon
                type={token}
                size="md"
                variant={isGold ? 'chip' : 'gem'}
                className="w-12 h-12 sm:w-14 sm:h-14 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform hover:scale-110 transition-transform"
              />

              <div className="mt-1.5 px-2 py-0.5 rounded-md bg-[#0B0F1A]/80 border border-white/10 text-[10px] font-['Cinzel'] font-bold text-slate-200 tracking-wider uppercase">
                {token}
              </div>

              {count > 1 && (
                <div className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-mono font-black text-xs border border-white shadow-lg flex items-center gap-0.5 animate-bounce">
                  <span>×</span>
                  <span>{count}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActionShowcase = () => {
    // 1. Take Tokens
    if (log.action === 'take_tokens') {
      const tokensMap = log.details?.tokens || {};
      return renderGemPlinths(tokensMap);
    }

    // 2. Buy Card
    if (log.action === 'buy_card' && card) {
      return (
        <div className="flex flex-col items-center justify-center my-2 gap-2.5">
          {card.prestigePoints > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse">
              <Crown size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
                +{card.prestigePoints} PRESTIGE POINTS
              </span>
            </div>
          )}

          <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-emerald-400/50">
            <DevelopmentCardView
              card={card}
              disabled={false}
              canReserve={false}
              compact={true}
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            <span>Engine Discount:</span>
            <GemIcon type={card.gemBonus} size="xs" variant="gem" className="inline w-3.5 h-3.5" />
            <span className="font-bold">+1 {card.gemBonus.toUpperCase()}</span>
          </div>
        </div>
      );
    }

    // 3. Reserve Card
    if (log.action === 'reserve_card') {
      return (
        <div className="flex flex-col items-center justify-center my-2 gap-2.5">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {card ? (
              <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-sky-400/50">
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
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border shadow-xl bg-amber-500/20 border-amber-400 animate-gem-float"
                style={{ boxShadow: '0 0 25px rgba(245, 158, 11, 0.55)' }}
                title="1 Gold Joker Token awarded"
              >
                <GemIcon type="gold" size="md" variant="chip" className="w-12 h-12 filter drop-shadow-md" />
                <span className="font-['Cinzel'] font-black text-xs text-amber-300 mt-1">
                  +1 GOLD JOKER
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Noble Visit
    if (log.action === 'noble_visit' && noble) {
      return (
        <div className="flex flex-col items-center justify-center my-2 gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
            <Award size={15} className="text-amber-400" />
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
              +{noble.prestigePoints} PRESTIGE AWARDED
            </span>
          </div>

          <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-amber-400/60">
            <NobleTileView noble={noble} compact={true} className="w-36" />
          </div>
        </div>
      );
    }

    // 5. Discard Tokens
    if (log.action === 'discard_tokens') {
      const tokensMap = log.details?.tokens || {};
      return renderGemPlinths(tokensMap);
    }

    // Fallback description
    return (
      <div className="text-xs text-slate-300 leading-relaxed text-center font-sans bg-[#0B0F1A]/80 p-3 rounded-xl border border-white/5 my-2">
        {log.description}
      </div>
    );
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A12]/60 backdrop-blur-xs select-none cursor-pointer animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      {/* Dynamic Radial Aura behind showcase */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full pointer-events-none animate-glow-pulse"
        style={{
          background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Main Showcase Medallion */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-[#0F1626]/95 border-2 border-amber-400/60 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-2xl p-4 sm:p-5 text-slate-100 overflow-hidden animate-showcase-in"
      >
        {/* Animated Top Golden Light Beam */}
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${theme.accentGradient} shadow-sm`}
        />

        {/* Header: Royal Heraldry Banner */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="text-3xl sm:text-4xl filter drop-shadow-md">{avatar}</span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0F1626] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="font-['Cinzel'] font-black text-sm sm:text-base text-amber-200 truncate tracking-wide leading-tight">
                {log.playerName.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 font-bold">
                  Round {log.turn}
                </span>
                <span>•</span>
                <span className="text-slate-400">{theme.subtitle}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold font-['Cinzel'] tracking-wider shadow-sm ${theme.badgeBg}`}
            >
              {theme.icon}
              <span>{theme.title}</span>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* The Action Visual Centerpiece */}
        <div className="my-1">{renderActionShowcase()}</div>

        {/* Footer: Dismiss Hint & Shimmering Progress Bar */}
        <div className="pt-2 border-t border-white/8 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-mono text-slate-400">Tap anywhere to close</span>
          <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${theme.accentGradient} rounded-full animate-action-progress`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
