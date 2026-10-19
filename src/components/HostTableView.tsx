import React, { useState } from 'react';
import { PublicGameState } from '../types/multiplayer.ts';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { RulesModal } from './RulesModal.tsx';
import { calculateBonuses } from '../game/rules.ts';
import { GameLogEntry, NobleTile, GemType, TokenType } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Crown, Shield, Tv, History, BookOpen, Volume2, VolumeX, RotateCcw, Trophy, Sparkles, Zap, PlusCircle, LogOut } from 'lucide-react';
import { sound } from '../game/sound.ts';
import { TurnActionNotification } from './TurnActionNotification.tsx';

interface HostTableViewProps {
  publicState: PublicGameState;
  onRestartMatch: () => void;
  onExitHost: () => void;
  onCreateNewRoom?: () => void;
}

export const HostTableView: React.FC<HostTableViewProps> = ({
  publicState,
  onRestartMatch,
  onExitHost,
  onCreateNewRoom,
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
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#070B14]/95 border border-amber-500/25 shadow-md shrink-0">
            <div className="flex items-center gap-1.5 pr-2 sm:pr-2.5 border-r border-white/10">
              <Sparkles size={16} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-200 hidden md:inline">
                BANK
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {ALL_TOKENS.map(t => {
                const count = publicState.bank[t] || 0;
                return (
                  <div
                    key={t}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border transition-all ${
                      count > 0
                        ? 'bg-white/5 border-white/10 text-white shadow-xs'
                        : 'bg-white/2 border-transparent text-slate-600 opacity-25'
                    }`}
                    title={`${t}: ${count} available in gem bank`}
                  >
                    <GemIcon
                      type={t}
                      size="sm"
                      variant={t === 'gold' ? 'chip' : 'gem'}
                      className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                    />
                    <span className="font-mono font-black text-sm sm:text-base text-white leading-none">
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
            title="Restart Match (Same Players)"
          >
            <RotateCcw size={14} />
          </button>
          {onCreateNewRoom && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Close this room and generate a new room code with a fresh QR code?')) {
                  onCreateNewRoom();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 text-xs font-['Cinzel'] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Close Room & Create New Room"
            >
              <PlusCircle size={13} />
              <span className="hidden sm:inline">New Room</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Close this match and return to the main menu?')) {
                onExitHost();
              }
            }}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
            title="Exit to Menu"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Playing Arena: 3 Columns (Left: Nobles Dais | Center: Cards Arena | Right: Scoreboard) */}
      <main className="relative flex-1 max-w-[1536px] w-full mx-auto py-2.5 sm:py-3.5 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] items-center lg:items-start justify-center gap-4 lg:gap-6 z-10 overflow-y-auto">
        {/* Left Column: Noble Patrons Dais (Zero overflow, 2 in 1st row & 1 centered in 2nd row when 3 nobles) */}
        <aside
          className={`relative flex flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-[#070B14]/95 border border-amber-500/20 shadow-2xl backdrop-blur-md shrink-0 z-10 w-full ${
            publicState.nobles.length > 1
              ? 'max-w-[288px] xl:max-w-[308px]'
              : 'max-w-[170px] xl:max-w-[180px]'
          } justify-self-center lg:justify-self-end`}
          aria-label="Noble Patrons Dais"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-amber-500/20 w-full px-1 shrink-0">
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
                    border: 'border-amber-500/40',
                    bg: 'bg-gradient-to-b from-amber-950/40 via-[#141C2C] to-[#0E1522]',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    label: 'T3',
                  }
                : tier === 2
                ? {
                    border: 'border-sky-500/40',
                    bg: 'bg-gradient-to-b from-sky-950/40 via-[#141C2C] to-[#0E1522]',
                    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                    label: 'T2',
                  }
                : {
                    border: 'border-emerald-500/40',
                    bg: 'bg-gradient-to-b from-emerald-950/40 via-[#141C2C] to-[#0E1522]',
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
          className="relative flex flex-col gap-2.5 w-full max-w-[320px] xl:max-w-[350px] 2xl:max-w-[380px] shrink-0 z-10 justify-self-center lg:justify-self-start"
          aria-label="Players Scoreboard"
        >
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#070B14]/95 border border-amber-500/20 shadow-md shrink-0">
            <div className="flex items-center gap-1.5">
              <Crown size={16} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-200">
                Scoreboard
              </span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              Target: <b className="text-amber-300 font-mono text-sm">{publicState.targetVP}</b> VP
            </span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-none lg:max-h-[calc(100vh-140px)] pr-0.5">
            {publicState.players.map((p, idx) => {
              const isActive = idx === publicState.activePlayerIndex;
              const bonuses = calculateBonuses(p.cards);
              const totalBonuses = Object.values(bonuses).reduce((a, b) => a + b, 0);
              const totalTokens = Object.values(p.tokens).reduce((acc, c) => acc + c, 0);

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#141D2E] border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-[#0C121E] border-white/8 shadow-md opacity-95 hover:opacity-100'
                  }`}
                >
                  {/* Row 1: Avatar, Name, VP score */}
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <span className="text-2xl sm:text-3xl filter drop-shadow">{p.avatar}</span>
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#141D2E] animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-['Cinzel'] font-bold text-sm sm:text-base text-slate-100 truncate flex items-center gap-1.5">
                          <span className={isActive ? 'text-amber-300 font-black' : 'text-slate-100'}>
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black font-sans uppercase">
                              TURN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{p.cards.length} cards</span>
                          {p.reservedCardsCount > 0 && (
                            <span className="text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {p.reservedCardsCount} res
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prestige Points */}
                    <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-500/25 to-yellow-500/15 border border-amber-500/40 px-3 py-1.5 rounded-xl shrink-0 shadow-sm">
                      <Crown size={16} className="text-amber-400" />
                      <span className="font-['Cinzel'] font-black text-amber-300 text-base sm:text-lg leading-none">
                        {p.prestigePoints}
                      </span>
                      <span className="text-xs text-amber-400/80 font-mono font-bold leading-none">/{publicState.targetVP}</span>
                    </div>
                  </div>

                  {/* Unified Buying Power Strip (Total Power = Tokens + Discounts combined) */}
                  <div className="bg-[#070B14]/80 rounded-xl p-2 sm:p-2.5 border border-white/6">
                    <div className="flex items-center justify-between text-xs mb-1.5 px-0.5">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-slate-200 font-bold uppercase tracking-wider font-['Cinzel'] text-xs">
                          Buying Power
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className={totalTokens > 8 ? 'text-amber-400 font-bold' : 'text-slate-300'} title="Tokens in hand / 10 max limit">
                          {totalTokens}/10<span className="text-[9px] text-slate-400 ml-0.5">tok</span>
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-amber-300 font-bold" title="Permanent card bonuses">
                          +{totalBonuses}<span className="text-[9px] text-amber-400/80 ml-0.5">disc</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {ALL_TOKENS.map(t => {
                        const isGold = t === 'gold';
                        const tokenCount = p.tokens[t] || 0;
                        const bonusCount = isGold ? 0 : (bonuses[t as GemType] || 0);
                        const totalPower = tokenCount + bonusCount;
                        const hasPower = totalPower > 0;

                        return (
                          <div
                            key={t}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                              hasPower
                                ? isGold
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm ring-1 ring-amber-400/25'
                                : bonusCount > 0
                                ? 'bg-amber-500/10 border-amber-500/30 text-white shadow-sm ring-1 ring-amber-400/20'
                                : 'bg-white/8 border-white/15 text-white shadow-xs'
                                : 'bg-white/3 border-white/5 text-slate-400 opacity-60'
                            }`}
                            title={
                              isGold
                                ? `Gold: ${tokenCount} Wildcard token${tokenCount === 1 ? '' : 's'}`
                                : `${t}: ${totalPower} Total Buying Power (${tokenCount} token${tokenCount === 1 ? '' : 's'}${bonusCount > 0 ? ` + ${bonusCount} discount card${bonusCount === 1 ? '' : 's'}` : ''})`
                            }
                          >
                            {/* Gem Symbol with +X Discount Badge on Top-Right */}
                            <div className="relative flex items-center justify-center">
                              <GemIcon
                                type={t}
                                size="sm"
                                variant={isGold ? 'chip' : 'gem'}
                                className="w-6 h-6 sm:w-7 sm:h-7 shrink-0"
                              />
                              {bonusCount > 0 && (
                                <span
                                  className="absolute -top-1.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono font-black text-[9px] sm:text-[10px] leading-none px-1.5 py-0.5 rounded-full border border-amber-100 shadow-xs z-10"
                                  title={`+${bonusCount} permanent discount card${bonusCount === 1 ? '' : 's'}`}
                                >
                                  +{bonusCount}
                                </span>
                              )}
                            </div>

                            {/* Total Buying Power under Gem Symbol */}
                            <span
                              className={`font-mono font-black text-sm sm:text-base leading-none mt-2 text-center ${
                                hasPower
                                  ? isGold
                                    ? 'text-amber-300 font-black'
                                    : bonusCount > 0
                                    ? 'text-amber-100 font-black'
                                    : 'text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              {totalPower}
                            </span>
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

            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestartMatch}
                className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                <span>Play Again (Same Room & Players)</span>
              </button>

              {onCreateNewRoom && (
                <button
                  type="button"
                  onClick={onCreateNewRoom}
                  className="w-full py-2.5 px-6 rounded-xl bg-emerald-500/20 border border-emerald-400/50 hover:bg-emerald-500/30 text-emerald-300 font-['Cinzel'] font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlusCircle size={15} />
                  <span>Create New Room (New QR Code)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExitHost}
                className="w-full py-2 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 font-['Cinzel'] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Exit to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
