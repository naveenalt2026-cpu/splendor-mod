import React, { useEffect } from 'react';
import { DevelopmentCard, GameLogEntry, GemType, NobleTile, TokenType, TokenCount } from '../types/game.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import {
  ALL_TOKENS,
  GEM_COLORS,
  NOBLE_TILES,
  TIER_1_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
} from '../game/constants.ts';
import { Sparkles, Coins, Bookmark, Crown, Award, ShieldAlert, X, Zap } from 'lucide-react';

const ALL_CARDS: DevelopmentCard[] = [
  ...TIER_1_CARDS,
  ...TIER_2_CARDS,
  ...TIER_3_CARDS,
];

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
  // Auto-dismiss after 3.8 seconds matching progress bar animation
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3800);
    return () => clearTimeout(timer);
  }, [log.id, onDismiss]);

  const avatar = playerAvatar || log.details?.playerAvatar || '👑';

  // 1. Robust Card Resolution (never falls back to blank)
  const card: DevelopmentCard | undefined = (() => {
    if (log.details?.card) return log.details.card;

    if (log.details?.cardId) {
      const found = ALL_CARDS.find(c => c.id === log.details?.cardId);
      if (found) return found;
    }

    if (log.details?.cardName) {
      const found = ALL_CARDS.find(
        c => c.name.toLowerCase() === log.details?.cardName?.toLowerCase()
      );
      if (found) return found;
    }

    if (log.description) {
      const found = ALL_CARDS.find(c =>
        log.description.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found) return found;
    }

    if (log.details?.cardBonus || log.details?.cardTier) {
      return {
        id: log.details.cardId || 'reconstructed_card',
        tier: log.details.cardTier || 1,
        name: log.details.cardName || 'Development Card',
        gemBonus: log.details.cardBonus || 'ruby',
        prestigePoints: log.details.prestigePointsGained || 0,
        illustration: log.details.cardIllustration || '💎',
        cost: {},
      };
    }

    return undefined;
  })();

  // 2. Robust Noble Resolution
  const noble: NobleTile | undefined = (() => {
    if (log.details?.noble) return log.details.noble;

    if (log.details?.nobleName) {
      const found = NOBLE_TILES.find(
        n => n.name.toLowerCase() === log.details?.nobleName?.toLowerCase()
      );
      if (found) return found;
    }

    if (log.description) {
      const found = NOBLE_TILES.find(n =>
        log.description.toLowerCase().includes(n.name.toLowerCase())
      );
      if (found) return found;
    }

    return undefined;
  })();

  // 3. Robust Tokens Resolution
  const tokensMap: Partial<TokenCount> = (() => {
    if (log.details?.tokens && Object.keys(log.details.tokens).length > 0) {
      return log.details.tokens;
    }

    const parsed: Partial<TokenCount> = {};
    if (log.description) {
      const desc = log.description.toLowerCase();
      for (const t of ALL_TOKENS) {
        if (desc.includes(t)) {
          const match = desc.match(new RegExp(`(\\d+)\\s*${t}`));
          if (match) {
            parsed[t] = parseInt(match[1], 10);
          } else {
            parsed[t] = (parsed[t] || 0) + 1;
          }
        }
      }
    }

    return parsed;
  })();

  const getActionTheme = () => {
    switch (log.action) {
      case 'buy_card':
        return {
          title: 'CARD PURCHASED',
          subtitle: 'Acquired into empire tableau',
          icon: <Sparkles size={14} className="text-emerald-400" />,
          badgeBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
          glowColor: 'rgba(16, 185, 129, 0.35)',
          accentGradient: 'from-emerald-500 via-teal-400 to-emerald-500',
        };
      case 'take_tokens':
        return {
          title: 'GEMS COLLECTED',
          subtitle: 'Drawn from central vault',
          icon: <Coins size={14} className="text-amber-400" />,
          badgeBg: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
          glowColor: 'rgba(245, 158, 11, 0.35)',
          accentGradient: 'from-amber-400 via-yellow-300 to-amber-500',
        };
      case 'reserve_card':
        return {
          title: 'CARD RESERVED',
          subtitle: 'Secured into private hand',
          icon: <Bookmark size={14} className="text-sky-400" />,
          badgeBg: 'bg-sky-500/20 border-sky-400/50 text-sky-300',
          glowColor: 'rgba(56, 189, 248, 0.35)',
          accentGradient: 'from-sky-400 via-cyan-300 to-sky-500',
        };
      case 'noble_visit':
        return {
          title: 'NOBLE PATRONAGE',
          subtitle: 'Illustrious visitor pledged allegiance',
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
          title: 'MOVE COMPLETE',
          subtitle: 'Turn executed successfully',
          icon: <Zap size={14} className="text-amber-400" />,
          badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
          glowColor: 'rgba(245, 158, 11, 0.25)',
          accentGradient: 'from-amber-400 via-amber-300 to-amber-500',
        };
    }
  };

  const theme = getActionTheme();

  // Render glowing 3D-styled Gem Plinths with actual gem symbols
  const renderGemPlinths = (map: Partial<TokenCount>) => {
    const entries = (Object.entries(map) as [TokenType, number][]).filter(
      ([_, count]) => count && count > 0
    );

    if (entries.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-300">
          <Coins size={18} className="text-amber-400" />
          <span>Gems collected from the bank</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center my-1 gap-3">
        {/* Glowing floating 3D gem plinths */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {entries.map(([token, count], idx) => {
            const isGold = token === 'gold';
            const gemColor = !isGold ? GEM_COLORS[token as GemType] : null;

            return (
              <div
                key={token}
                className="relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 animate-gem-float shadow-xl"
                style={{
                  backgroundColor: gemColor ? `${gemColor.primary}25` : '#f59e0b25',
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

                <div className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0B0F1A]/90 border border-white/10 text-[11px] font-mono font-bold text-white">
                  <GemIcon type={token} size="xs" variant={isGold ? 'chip' : 'gem'} className="w-3.5 h-3.5" />
                  <span>+{count}</span>
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

        {/* Gem Token Chips summary */}
        <div className="flex items-center justify-center gap-2 flex-wrap px-3 py-1.5 rounded-xl bg-[#0B0F1A]/80 border border-white/10 text-xs">
          <span className="font-['Cinzel'] text-[11px] text-slate-400 uppercase tracking-wide">Acquired:</span>
          {entries.map(([token, count]) => (
            <span
              key={token}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono font-bold text-xs"
            >
              <GemIcon type={token} size="xs" variant={token === 'gold' ? 'chip' : 'gem'} className="w-3.5 h-3.5" />
              <span>+{count} {token.toUpperCase()}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderActionShowcase = () => {
    // 1. Take Tokens
    if (log.action === 'take_tokens') {
      return renderGemPlinths(tokensMap);
    }

    // 2. Buy Card (always renders the actual Card itself!)
    if (log.action === 'buy_card') {
      const activeCard = card || {
        id: 'purchased_card',
        tier: 1,
        name: 'Development Card',
        gemBonus: 'ruby' as GemType,
        prestigePoints: 0,
        illustration: '💎',
        cost: {},
      };

      return (
        <div className="flex flex-col items-center justify-center my-1 gap-2.5">
          {activeCard.prestigePoints > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse">
              <Crown size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
                +{activeCard.prestigePoints} PRESTIGE POINTS
              </span>
            </div>
          )}

          {/* Physical Development Card Itself */}
          <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-emerald-400/60">
            <DevelopmentCardView
              card={activeCard}
              disabled={false}
              canReserve={false}
              compact={false}
            />
          </div>

          {/* Card Cost Paid with Gem Icons */}
          {activeCard.cost && Object.keys(activeCard.cost).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0B0F1A]/90 border border-white/10 text-xs text-slate-300 flex-wrap justify-center">
              <span className="font-['Cinzel'] text-[11px] text-slate-400 uppercase tracking-wide">Paid:</span>
              {(Object.entries(activeCard.cost) as [GemType, number][]).map(([gem, count]) => (
                <span
                  key={gem}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono font-bold text-xs"
                >
                  <GemIcon type={gem} size="xs" variant="gem" className="w-3.5 h-3.5" />
                  <span>{count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Permanent Discount Gem Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-300">
            <span className="font-['Cinzel'] text-[11px] uppercase tracking-wide">Permanent Discount:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-200">
              <GemIcon type={activeCard.gemBonus} size="xs" variant="gem" className="w-4 h-4" />
              <span>+1 {activeCard.gemBonus.toUpperCase()}</span>
            </span>
          </div>
        </div>
      );
    }

    // 3. Reserve Card (Card itself + Gold Joker coin)
    if (log.action === 'reserve_card') {
      return (
        <div className="flex flex-col items-center justify-center my-1 gap-2.5">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {card ? (
              <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-sky-400/60">
                <DevelopmentCardView
                  card={card}
                  disabled={false}
                  canReserve={false}
                  compact={false}
                />
              </div>
            ) : (
              <div className="w-28 sm:w-30 h-48 sm:h-52 rounded-2xl bg-gradient-to-b from-[#151e33] to-[#0B0F1A] border-2 border-sky-400/60 flex flex-col items-center justify-between p-3 shadow-xl">
                <div className="w-full flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-['Cinzel'] font-bold text-sky-300">
                    Tier {log.details?.cardTier || 1}
                  </span>
                  <span className="text-xs">🔒</span>
                </div>
                <span className="text-4xl filter drop-shadow animate-pulse">📜</span>
                <span className="text-[10px] font-['Cinzel'] font-bold text-sky-200 uppercase tracking-wider text-center">
                  Reserved Card
                </span>
              </div>
            )}

            {/* Gold Joker Coin Symbol */}
            {log.details?.goldAwarded && (
              <div
                className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border shadow-xl bg-amber-500/20 border-amber-400 animate-gem-float"
                style={{ boxShadow: '0 0 25px rgba(245, 158, 11, 0.55)' }}
                title="1 Gold Joker Token awarded"
              >
                <GemIcon type="gold" size="md" variant="chip" className="w-12 h-12 filter drop-shadow-md" />
                <span className="font-['Cinzel'] font-black text-xs text-amber-300 mt-1.5">
                  +1 GOLD JOKER
                </span>
              </div>
            )}
          </div>

          {card && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/35 text-xs text-sky-300">
              <span className="font-['Cinzel'] text-[11px] uppercase tracking-wide">Reserved For Bonus:</span>
              <span className="inline-flex items-center gap-1 font-bold text-sky-200">
                <GemIcon type={card.gemBonus} size="xs" variant="gem" className="w-4 h-4" />
                <span>{card.gemBonus.toUpperCase()}</span>
              </span>
            </div>
          )}
        </div>
      );
    }

    // 4. Noble Visit (Noble Tile itself with Cameo Portrait & Gem Requirements)
    if (log.action === 'noble_visit') {
      const activeNoble = noble || NOBLE_TILES[0];

      return (
        <div className="flex flex-col items-center justify-center my-1 gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
            <Award size={15} className="text-amber-400" />
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-300 tracking-wider">
              +{activeNoble.prestigePoints} PRESTIGE AWARDED
            </span>
          </div>

          {/* Physical Noble Tile Itself */}
          <div className="transform hover:scale-105 transition-transform duration-200 shadow-2xl rounded-2xl ring-2 ring-amber-400/60">
            <NobleTileView noble={activeNoble} compact={true} className="w-36" />
          </div>

          {/* Patron Requirements Matched with Gem Icons */}
          {activeNoble.requirements && Object.keys(activeNoble.requirements).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0B0F1A]/90 border border-white/10 text-xs text-slate-300 flex-wrap justify-center">
              <span className="font-['Cinzel'] text-[11px] text-slate-400 uppercase tracking-wide">Requirements Met:</span>
              {(Object.entries(activeNoble.requirements) as [GemType, number][]).map(([gem, count]) => (
                <span
                  key={gem}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono font-bold text-xs"
                >
                  <GemIcon type={gem} size="xs" variant="gem" className="w-3.5 h-3.5" />
                  <span>{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 5. Discard Tokens
    if (log.action === 'discard_tokens') {
      return renderGemPlinths(tokensMap);
    }

    // Fallback: Even in fallback, render visual gem badges if any tokens/gems mentioned
    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0B0F1A]/80 border border-white/10 my-2 gap-2 text-center">
        <Zap size={20} className="text-amber-400" />
        <span className="font-['Cinzel'] font-bold text-xs text-amber-200">
          {log.playerName} completed turn
        </span>
        <span className="text-xs text-slate-300">{log.description}</span>
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

        {/* The Action Visual Centerpiece: Actual physical Game Elements */}
        <div className="my-1.5">{renderActionShowcase()}</div>

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
