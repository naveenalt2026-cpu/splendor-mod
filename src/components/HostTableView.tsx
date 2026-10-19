import React, { useState } from 'react';
import { PublicGameState } from '../types/multiplayer.ts';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { RulesModal } from './RulesModal.tsx';
import { calculateBonuses } from '../game/rules.ts';
import { GameLogEntry, GemType, NobleTile, TokenType } from '../types/game.ts';
import { ALL_TOKENS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Crown, Shield, Tv, History, BookOpen, Volume2, VolumeX, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { sound } from '../game/sound.ts';
import { TurnActionNotification } from './TurnActionNotification.tsx';

const GEM_BUYING_POWER_STYLES: Record<
  TokenType,
  {
    cardActive: string;
    tokenActive: string;
  }
> = {
  ruby: {
    cardActive: 'border-red-500/70 bg-red-950/70 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.25)]',
    tokenActive: 'border-red-400 bg-red-900/60 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)] ring-1 ring-red-400/50',
  },
  sapphire: {
    cardActive: 'border-blue-500/70 bg-blue-950/70 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.25)]',
    tokenActive: 'border-blue-400 bg-blue-900/60 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50',
  },
  emerald: {
    cardActive: 'border-emerald-500/70 bg-emerald-950/70 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    tokenActive: 'border-emerald-400 bg-emerald-900/60 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50',
  },
  diamond: {
    cardActive: 'border-slate-300/70 bg-slate-800/70 text-slate-100 shadow-[0_0_8px_rgba(255,255,255,0.2)]',
    tokenActive: 'border-slate-200 bg-slate-700/70 text-white shadow-[0_0_8px_rgba(255,255,255,0.3)] ring-1 ring-white/60',
  },
  onyx: {
    cardActive: 'border-slate-500/70 bg-slate-900/90 text-slate-300 shadow-[0_0_8px_rgba(100,116,139,0.2)]',
    tokenActive: 'border-slate-400 bg-slate-800/80 text-slate-100 shadow-[0_0_8px_rgba(100,116,139,0.3)] ring-1 ring-slate-400/50',
  },
  gold: {
    cardActive: 'border-transparent bg-transparent text-slate-700',
    tokenActive: 'border-amber-400 bg-gradient-to-br from-amber-500/40 to-yellow-600/40 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.45)] ring-1 ring-amber-300/70',
  },
};

interface HostTableViewProps {
  publicState: PublicGameState;
  onRestartMatch: () => void;
  onExitHost: () => void;
}

export const HostTableView: React.FC<HostTableViewProps> = ({
  publicState,
  onRestartMatch,
  onExitHost,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebratingNoble, setCelebratingNoble] = useState<{
    noble: NobleTile;
    playerName: string;
    isHuman: boolean;
  } | null>(null);
  const [turnActionPopup, setTurnActionPopup] = useState<GameLogEntry | null>(null);
  const lastProcessedLogIdRef = React.useRef<string | null>(null);

  const activePlayer = publicState.players[publicState.activePlayerIndex] || publicState.players[0];

  // Listen to new actions in the game log to show clean turn action pop-ups
  React.useEffect(() => {
    if (!publicState.log || publicState.log.length === 0) return;
    const latestLog = publicState.log[0];

    // On initial mount, record current log ID to avoid showing stale actions
    if (lastProcessedLogIdRef.current === null) {
      lastProcessedLogIdRef.current = latestLog.id;
      return;
    }

    // New action occurred!
    if (latestLog.id !== lastProcessedLogIdRef.current) {
      lastProcessedLogIdRef.current = latestLog.id;

      // Skip initial game setup entry
      if (latestLog.id === 'log_0') return;

      // If noble celebration event is already handling fanfare, skip duplicate popup
      if (latestLog.action === 'noble_visit' && publicState.claimedNobleEvent) {
        return;
      }

      // Play relevant action sound if sound enabled
      if (soundEnabled) {
        try {
          if (latestLog.action === 'buy_card') sound.playBuyCard();
          else if (latestLog.action === 'take_tokens') sound.playTokenPickup();
          else if (latestLog.action === 'reserve_card') sound.playReserveCard();
          else if (latestLog.action === 'noble_visit') sound.playNobleVisit();
        } catch {
          // Ignore sound playback errors
        }
      }

      setTurnActionPopup(latestLog);
    }
  }, [publicState.log, publicState.claimedNobleEvent, soundEnabled]);

  // Listen to noble claim events for fanfare
  React.useEffect(() => {
    if (publicState.claimedNobleEvent) {
      setCelebratingNoble({
        noble: publicState.claimedNobleEvent.noble,
        playerName: publicState.claimedNobleEvent.playerName,
        isHuman: true,
      });
    }
  }, [publicState.claimedNobleEvent]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMuted(!next);
  };

  const popupPlayer = turnActionPopup
    ? publicState.players.find(p => p.id === turnActionPopup.playerId)
    : null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between py-2 sm:py-3 px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 select-none relative overflow-x-hidden font-sans">
      {/* Top Header: Slim, streamlined bar */}
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#121826] border border-white/8 shadow-md backdrop-blur-md z-20 max-w-[1536px] w-full mx-auto">
        {/* Left: Branding & Room Session (Target VP removed as requested) */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
            <Tv size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-200 tracking-wider">
              SPLENDOR
            </span>
            <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              {publicState.sessionId}
            </span>
          </div>
        </div>

        {/* Center: Active Player Turn Capsule & Contained Gem Bank Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
          {/* Active Player Turn Capsule */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-400/40 shadow-sm shrink-0">
            <span className="text-base filter drop-shadow">{activePlayer?.avatar || '👑'}</span>
            <span className="font-['Cinzel'] font-black text-xs text-amber-300 tracking-wider">
              {activePlayer?.name?.toUpperCase()}'S TURN
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono">
              {publicState.status === 'final_round' ? '⚠️ Final Round' : `R${publicState.turnCount}`}
            </span>
          </div>

          {/* Gem Bank Pill inside Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-[#0B0F1A]/90 border border-white/10 shadow-inner shrink-0">
            <div className="flex items-center gap-1 pr-1.5 border-r border-white/10">
              <Sparkles size={12} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-[10px] uppercase tracking-wider text-amber-200 hidden md:inline">
                BANK
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {ALL_TOKENS.map(t => {
                const count = publicState.bank[t] || 0;
                return (
                  <div
                    key={t}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all ${
                      count > 0
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white/2 border-transparent text-slate-600 opacity-25'
                    }`}
                    title={`${t}: ${count} available in gem bank`}
                  >
                    <GemIcon
                      type={t}
                      size="xs"
                      variant={t === 'gold' ? 'chip' : 'gem'}
                      className="w-3.5 h-3.5"
                    />
                    <span className="font-mono font-bold text-xs text-slate-100">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sleek mini utility controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Splendor Rules"
          >
            <BookOpen size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Move History"
          >
            <History size={14} />
          </button>
          <button
            type="button"
            onClick={onRestartMatch}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Main Playing Arena: 3 Columns (Left: Nobles Dais | Center: Cards Arena | Right: Scoreboard) */}
      <main className="relative flex-1 max-w-[1536px] w-full mx-auto py-2.5 sm:py-3.5 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] items-center lg:items-start justify-center gap-4 lg:gap-6 z-10 overflow-y-auto">
        {/* Left Column: Noble Patrons Dais (Zero overflow, 2 in 1st row & 1 centered in 2nd row when 3 nobles) */}
        <aside
          className={`relative flex flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-[#121826]/90 border border-white/8 shadow-xl backdrop-blur-md shrink-0 z-10 w-full ${
            publicState.nobles.length > 1
              ? 'max-w-[288px] xl:max-w-[308px]'
              : 'max-w-[170px] xl:max-w-[180px]'
          } justify-self-center lg:justify-self-end`}
          aria-label="Noble Patrons Dais"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-white/10 w-full px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200">
                Nobles
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
              {publicState.nobles.length} left
            </span>
          </div>

          {publicState.nobles.length === 0 ? (
            <div className="text-xs text-slate-500 font-['Cinzel'] p-6 text-center">
              All Nobles Claimed!
            </div>
          ) : (
            <div
              className={`w-full gap-2 ${
                publicState.nobles.length > 1
                  ? 'grid grid-cols-2'
                  : 'flex flex-col'
              }`}
            >
              {publicState.nobles.map((noble, index) => {
                const isSingleLastInRow =
                  publicState.nobles.length > 1 &&
                  index === publicState.nobles.length - 1 &&
                  publicState.nobles.length % 2 === 1;

                return (
                  <div
                    key={noble.id}
                    className={
                      isSingleLastInRow
                        ? 'col-span-2 flex justify-center w-full'
                        : 'w-full flex justify-center'
                    }
                  >
                    <NobleTileView
                      noble={noble}
                      compact={true}
                      className={
                        isSingleLastInRow ? 'w-[calc(50%-4px)]' : 'w-full'
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Center Column: Three Horizontal Rows of Development Cards (Tier 3 -> Tier 2 -> Tier 1) */}
        <section
          className="flex flex-col gap-1.5 sm:gap-2 shrink-0 justify-self-center mx-auto overflow-x-auto pb-1"
          aria-label="Development Cards Arena"
        >
          {([3, 2, 1] as const).map(tier => {
            const faceUp = publicState.faceUpCards[tier] || [];
            const deckRemaining = publicState.decks[tier] || 0;

            const tierStyle =
              tier === 3
                ? {
                    border: 'border-amber-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    label: 'T3',
                  }
                : tier === 2
                ? {
                    border: 'border-sky-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                    label: 'T2',
                  }
                : {
                    border: 'border-emerald-500/30',
                    bg: 'bg-[#121826]',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    label: 'T1',
                  };

            return (
              <div key={tier} className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                {/* Tier Deck Card Stack (Increased height to match development cards) */}
                <div
                  className={`relative shrink-0 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} w-14 sm:w-16 md:w-18 h-48 sm:h-52 md:h-56 lg:h-[216px] xl:h-[224px] flex flex-col items-center justify-center select-none shadow-md`}
                >
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${tierStyle.badge}`}>
                    {tierStyle.label}
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1.5">
                    {deckRemaining}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-['Cinzel'] tracking-wider">
                    Cards
                  </div>
                </div>

                {/* 4 Face-Up Cards per Tier with reduced column spacing */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
                  {faceUp.map(card => (
                    <div key={card.id} className="relative shrink-0">
                      <DevelopmentCardView
                        card={card}
                        disabled={false}
                        canReserve={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Right Column: Player Game Details Scoreboard */}
        <aside
          className="relative flex flex-col gap-2 w-full max-w-[288px] xl:max-w-[308px] shrink-0 z-10 justify-self-center lg:justify-self-start"
          aria-label="Players Scoreboard"
        >
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#121826]/80 border border-white/8 shrink-0">
            <div className="flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-wider text-amber-200">
                Scoreboard
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Target: <b className="text-amber-300 font-mono">{publicState.targetVP}</b> VP
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-none lg:max-h-[calc(100vh-140px)] pr-0.5">
            {publicState.players.map((p, idx) => {
              const isActive = idx === publicState.activePlayerIndex;
              const bonuses = calculateBonuses(p.cards);
              const totalBonuses = Object.values(bonuses).reduce((a, b) => a + b, 0);
              const totalTokens = Object.values(p.tokens).reduce((acc, c) => acc + c, 0);

              return (
                <div
                  key={p.id}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#151e33] border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-[#121826] border-white/8 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Row 1: Enlarged Avatar, Name, Reserved count & VP Score */}
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <span className="text-3xl filter drop-shadow-md">{p.avatar}</span>
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#151e33] animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-['Cinzel'] font-bold text-sm sm:text-base text-slate-100 truncate flex items-center gap-1.5">
                          <span className={isActive ? 'text-amber-300 font-black' : 'text-slate-100'}>
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[9px] font-black font-sans uppercase tracking-wider">
                              TURN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{p.cards.length} cards</span>
                          {p.reservedCardsCount > 0 && (
                            <span className="text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                              {p.reservedCardsCount} res
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Prestige Points Shield */}
                    <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-500/25 to-yellow-500/15 border border-amber-400/50 px-3 py-1.5 rounded-xl shrink-0 shadow-md">
                      <Crown size={15} className="text-amber-400" />
                      <span className="font-['Cinzel'] font-black text-amber-300 text-base sm:text-lg leading-none">
                        {p.prestigePoints}
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono font-bold leading-none">/{publicState.targetVP}</span>
                    </div>
                  </div>

                  {/* Combined Buying Power: 6 Color Columns (Card Discounts stacked right above Tokens) */}
                  <div className="bg-[#0B0F1A]/85 rounded-xl p-2 border border-white/5">
                    {/* Header Bar with Legend: [Rect] Card Discounts · [Circle] Tokens in Hand */}
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-['Cinzel']">
                        Buying Power
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-amber-300 font-bold flex items-center gap-1" title="Permanent Card Discounts">
                          <span className="inline-block w-2.5 h-3 rounded-[2px] border border-amber-400/60 bg-amber-400/20" />
                          +{totalBonuses}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-200 font-bold flex items-center gap-1" title="Tokens in Hand (max 10)">
                          <span className="inline-block w-2.5 h-2.5 rounded-full border border-slate-300/60 bg-slate-300/20" />
                          {totalTokens}/10
                        </span>
                      </div>
                    </div>

                    {/* 6 Color Columns (5 Gems + 1 Gold) */}
                    <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                      {ALL_TOKENS.map(t => {
                        const isGem = t !== 'gold';
                        const bonus = isGem ? (bonuses[t as GemType] || 0) : 0;
                        const tokenCount = p.tokens[t] || 0;
                        const styles = GEM_BUYING_POWER_STYLES[t];
                        const totalPower = bonus + tokenCount;

                        return (
                          <div
                            key={t}
                            className="flex flex-col items-center gap-1"
                            title={
                              t === 'gold'
                                ? `Gold: ${tokenCount} wild tokens in hand`
                                : `${t.toUpperCase()}: ${bonus} card bonus + ${tokenCount} tokens = ${totalPower} total buying power`
                            }
                          >
                            {/* Column Gem Identity */}
                            <div className="flex items-center justify-center w-full py-0.5">
                              <GemIcon
                                type={t}
                                size="xs"
                                variant={t === 'gold' ? 'chip' : 'gem'}
                                className="w-3.5 h-3.5 filter drop-shadow"
                              />
                            </div>

                            {/* Card Discount: Small Card Rectangle */}
                            <div
                              className={`w-full h-6.5 rounded-md border flex items-center justify-center transition-all ${
                                bonus > 0
                                  ? styles.cardActive
                                  : 'bg-[#0B0F1A]/40 border-white/5 text-slate-600 opacity-25'
                              }`}
                            >
                              <span className="font-mono text-xs font-black leading-none">
                                {t === 'gold' ? '—' : bonus > 0 ? `+${bonus}` : '0'}
                              </span>
                            </div>

                            {/* Token Count: Small Circular Chip */}
                            <div
                              className={`w-full max-w-[28px] h-6.5 rounded-full border flex items-center justify-center transition-all ${
                                tokenCount > 0
                                  ? styles.tokenActive
                                  : 'bg-transparent border-white/5 text-slate-600 opacity-20'
                              }`}
                            >
                              <span className="font-mono text-xs font-black leading-none">
                                {tokenCount}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      {/* Modals & Celebrations */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <ActionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={publicState.log}
      />

      {/* Turn Action Pop-Up after each player's completed move */}
      {turnActionPopup && (
        <TurnActionNotification
          log={turnActionPopup}
          playerAvatar={popupPlayer?.avatar}
          onDismiss={() => setTurnActionPopup(null)}
        />
      )}

      {celebratingNoble && (
        <NobleClaimCelebration
          noble={celebratingNoble.noble}
          playerName={celebratingNoble.playerName}
          isHuman={celebratingNoble.isHuman}
          onComplete={() => setCelebratingNoble(null)}
        />
      )}

      {/* Game Over Banner */}
      {publicState.status === 'game_over' && (
        <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#121826] border border-amber-400/60 shadow-2xl flex flex-col items-center">
            <Trophy size={48} className="text-amber-400 animate-bounce mb-3" />
            <h2 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-200 tracking-wider">
              VICTORY ACHIEVED!
            </h2>
            <p className="text-sm text-slate-300 mt-2 mb-6">
              A Renaissance Gem Master has accumulated the required prestige!
            </p>

            <button
              type="button"
              onClick={onRestartMatch}
              className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-base uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Start New Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
