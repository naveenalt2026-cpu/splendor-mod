import React, { useState, useEffect, useRef } from 'react';
import {
  CardAffordability,
  DevelopmentCard,
  GameLogEntry,
  GameState,
  GemType,
  NobleTile,
  Player,
  TokenCount,
  TokenType,
} from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS } from '../game/constants.ts';
import {
  calculateBonuses,
  checkCardAffordability,
  canTakeTokens,
  executeTakeTokens,
  executeBuyCard,
  executeReserveCard,
  executeDiscardTokens,
  finalizeTurn,
  createInitialGameState,
} from '../game/rules.ts';
import { executeAIMove } from '../game/ai.ts';
import { sound } from '../game/sound.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { NobleTileView } from './NobleTileView.tsx';
import { TurnActionNotification } from './TurnActionNotification.tsx';
import { NobleClaimCelebration } from './NobleClaimCelebration.tsx';
import { RulesModal } from './RulesModal.tsx';
import { ActionHistoryModal } from './ActionHistoryModal.tsx';
import { GameSettingsModal } from './GameSettingsModal.tsx';
import { DiscardTokensModal } from './DiscardTokensModal.tsx';
import {
  Crown,
  Shield,
  Tv,
  History,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Sparkles,
  Settings,
  LogOut,
  Check,
  X,
  Layers,
  ArrowRight,
  Bookmark,
} from 'lucide-react';

interface SoloTableViewProps {
  onExitSolo: () => void;
}

export const SoloTableView: React.FC<SoloTableViewProps> = ({ onExitSolo }) => {
  // Solo Match Configuration
  const [matchConfig, setMatchConfig] = useState({
    playerCount: 2,
    aiDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    targetVP: 15,
  });

  // Solo authoritative state
  const [state, setState] = useState<GameState>(() =>
    createInitialGameState({
      playerCount: matchConfig.playerCount,
      aiDifficulty: matchConfig.aiDifficulty,
    })
  );

  // User staged action states
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [stagedGems, setStagedGems] = useState<GemType[]>([]);
  const [confirmingDeckTier, setConfirmingDeckTier] = useState<1 | 2 | 3 | null>(null);
  const [isReservedDrawerOpen, setIsReservedDrawerOpen] = useState(false);

  // Modals & Celebrations
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebratingNoble, setCelebratingNoble] = useState<{
    noble: NobleTile;
    playerName: string;
    isHuman: boolean;
  } | null>(null);
  const [turnActionPopup, setTurnActionPopup] = useState<GameLogEntry | null>(null);
  const lastProcessedLogIdRef = useRef<string | null>(null);

  const humanPlayer = state.players[0];
  const activePlayer = state.players[state.activePlayerIndex] || state.players[0];
  const isHumanTurn = state.activePlayerIndex === 0 && state.status !== 'game_over';
  const humanBonuses = calculateBonuses(humanPlayer.cards);

  // Audio mute toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMuted(!next);
  };

  // Reset/Restart Solo Match
  const handleResetMatch = (newConfig = matchConfig) => {
    setMatchConfig(newConfig);
    setState(
      createInitialGameState({
        playerCount: newConfig.playerCount,
        aiDifficulty: newConfig.aiDifficulty,
      })
    );
    setSelectedCardId(null);
    setStagedGems([]);
    setConfirmingDeckTier(null);
    setIsReservedDrawerOpen(false);
    setTurnActionPopup(null);
    lastProcessedLogIdRef.current = null;
    sound.playTurnChime();
  };

  // AI turn processing
  useEffect(() => {
    if (state.status === 'game_over') return;
    if (state.activePlayerIndex !== 0) {
      setConfirmingDeckTier(null);
      setSelectedCardId(null);
      setStagedGems([]);
      setIsReservedDrawerOpen(false);

      const timer = setTimeout(() => {
        setState((prev) => {
          if (prev.activePlayerIndex === 0 || prev.status === 'game_over') return prev;
          const next = executeAIMove(prev, prev.activePlayerIndex);
          return next;
        });
      }, 1100);

      return () => clearTimeout(timer);
    }
  }, [state.activePlayerIndex, state.status, state.turnCount]);

  // Turn action popup listener on game log changes
  useEffect(() => {
    if (!state.log || state.log.length === 0) return;
    const latestLog = state.log[0];

    // Skip on initial mount
    if (lastProcessedLogIdRef.current === null) {
      lastProcessedLogIdRef.current = latestLog.id;
      return;
    }

    if (latestLog.id !== lastProcessedLogIdRef.current) {
      lastProcessedLogIdRef.current = latestLog.id;
      if (latestLog.id === 'log_0') return;

      // Play appropriate action sounds
      if (soundEnabled) {
        try {
          if (latestLog.action === 'buy_card') sound.playBuyCard();
          else if (latestLog.action === 'take_tokens') sound.playTokenPickup();
          else if (latestLog.action === 'reserve_card') sound.playReserveCard();
          else if (latestLog.action === 'noble_visit') sound.playNobleVisit();
        } catch {
          // ignore sound exceptions
        }
      }

      setTurnActionPopup(latestLog);
    }
  }, [state.log, soundEnabled]);

  // Noble celebration trigger
  useEffect(() => {
    if (state.claimedNobleEvent) {
      setCelebratingNoble({
        noble: state.claimedNobleEvent.noble,
        playerName: state.claimedNobleEvent.playerName,
        isHuman: state.claimedNobleEvent.playerIndex === 0,
      });
    }
  }, [state.claimedNobleEvent]);

  // Staged token selection logic
  const handleToggleStagedGem = (gem: GemType) => {
    if (!isHumanTurn) return;
    setSelectedCardId(null);
    setConfirmingDeckTier(null);
    sound.playTokenPickup();

    setStagedGems((prev) => {
      if (prev.includes(gem)) {
        if (prev.filter((g) => g === gem).length === 1 && prev.length === 1) {
          // Check if bank has at least 4 for double-take rule
          if (state.bank[gem] >= 4) return [gem, gem];
          return [];
        }
        return prev.filter((g) => g !== gem);
      }
      if (prev.length >= 3) return prev;
      return [...prev, gem];
    });
  };

  const handleClearStaged = () => setStagedGems([]);

  const handleConfirmTakeTokens = () => {
    if (!isHumanTurn || stagedGems.length === 0) return;
    const res = executeTakeTokens(state, 0, stagedGems);
    if (res.error) {
      sound.playError();
      return;
    }
    sound.playTokenDrop();
    setStagedGems([]);
    setState(res.nextState);
  };

  const canConfirmTokens = canTakeTokens(stagedGems, state.bank).valid;

  // Buy card action
  const handleBuyCard = (cardId: string, fromReserved = false) => {
    if (!isHumanTurn) return;
    const res = executeBuyCard(state, 0, cardId, fromReserved);
    if (res.error) {
      sound.playError();
      return;
    }
    sound.playBuyCard();
    setSelectedCardId(null);
    setIsReservedDrawerOpen(false);
    setState(res.nextState);
  };

  // Reserve card action
  const handleReserveCard = (cardId: string) => {
    if (!isHumanTurn) return;
    const res = executeReserveCard(state, 0, cardId);
    if (res.error) {
      sound.playError();
      return;
    }
    sound.playReserveCard();
    setSelectedCardId(null);
    setState(res.nextState);
  };

  // Blind reserve from deck tier
  const handleReserveDeck = (tier: 1 | 2 | 3) => {
    if (!isHumanTurn) return;
    const res = executeReserveCard(state, 0, undefined, tier);
    if (res.error) {
      sound.playError();
      return;
    }
    sound.playReserveCard();
    setConfirmingDeckTier(null);
    setState(res.nextState);
  };

  const popupPlayer = turnActionPopup
    ? state.players.find((p) => p.id === turnActionPopup.playerId)
    : null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between py-2 sm:py-3 px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 select-none relative overflow-x-hidden font-sans">
      {/* Top Header: Slim, streamlined bar matching HostTableView */}
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#121826] border border-white/8 shadow-md backdrop-blur-md z-20 max-w-[1536px] w-full mx-auto">
        {/* Left: Branding & Mode Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-sm">
            <Sparkles size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Cinzel'] font-black text-xs sm:text-sm text-amber-200 tracking-wider">
              SPLENDOR
            </span>
            <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              SOLO PRACTICE
            </span>
          </div>
        </div>

        {/* Center: Active Player Turn Capsule & Interactive Gem Bank Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
          {/* Active Player Turn Capsule */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm shrink-0 transition-all ${
              isHumanTurn
                ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-emerald-500/20 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border-amber-400/40'
            }`}
          >
            <span className="text-base filter drop-shadow">{activePlayer?.avatar || '👑'}</span>
            <span
              className={`font-['Cinzel'] font-black text-xs tracking-wider ${
                isHumanTurn ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {isHumanTurn ? 'YOUR TURN' : `${activePlayer?.name?.toUpperCase()}'S TURN (THINKING...)`}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHumanTurn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] text-slate-400 font-mono">
              {state.status === 'final_round' ? '⚠️ Final Round' : `R${state.turnCount}`}
            </span>
          </div>

          {/* Interactive Gem Bank Pill inside Header */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#070B14]/95 border border-amber-500/25 shadow-md shrink-0">
            <div className="flex items-center gap-1.5 pr-2 sm:pr-2.5 border-r border-white/10">
              <Sparkles size={16} className="text-amber-400" />
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-200 hidden md:inline">
                BANK
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {ALL_TOKENS.map((t) => {
                const count = state.bank[t] || 0;
                const isGem = t !== 'gold';
                const isStaged = isGem && stagedGems.includes(t as GemType);
                const stagedCount = isGem ? stagedGems.filter((g) => g === t).length : 0;

                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!isHumanTurn || !isGem || (count === 0 && !isStaged)}
                    onClick={() => isGem && handleToggleStagedGem(t as GemType)}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border transition-all ${
                      isStaged
                        ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-sm'
                        : count > 0
                        ? isHumanTurn && isGem
                          ? 'bg-white/5 border-white/10 text-white hover:border-amber-400/50 hover:bg-white/10 cursor-pointer active:scale-95'
                          : 'bg-white/5 border-white/10 text-white cursor-default'
                        : 'bg-white/2 border-transparent text-slate-600 opacity-25 cursor-not-allowed'
                    }`}
                    title={
                      isGem && isHumanTurn
                        ? `${t}: ${count} in bank. Click to stage/take token.`
                        : `${t}: ${count} available in gem bank`
                    }
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
                    {stagedCount > 0 && (
                      <span className="font-mono font-black text-xs text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded-full border border-amber-400/60 leading-none">
                        +{stagedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Token staging confirmation / cancel button */}
            {stagedGems.length > 0 && isHumanTurn && (
              <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/10">
                <button
                  type="button"
                  disabled={!canConfirmTokens}
                  onClick={handleConfirmTakeTokens}
                  className={`py-1 px-2.5 rounded-lg font-['Cinzel'] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    canConfirmTokens
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                  title={
                    canConfirmTokens
                      ? 'Confirm token collection'
                      : 'Take 3 different gems or 2 of the same color (if 4+ in bank)'
                  }
                >
                  <Check size={13} className="stroke-[3]" />
                  <span>Take ({stagedGems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearStaged}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors cursor-pointer"
                  title="Clear staged tokens"
                >
                  <X size={13} />
                </button>
              </div>
            )}
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
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Match Settings"
          >
            <Settings size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset this solo match?')) {
                handleResetMatch();
              }
            }}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Restart Match"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Exit solo practice and return to main menu?')) {
                onExitSolo();
              }
            }}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
            title="Exit to Main Menu"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Playing Arena: 3 Columns matching HostTableView exactly */}
      <main className="relative flex-1 max-w-[1536px] w-full mx-auto py-2.5 sm:py-3.5 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] items-center lg:items-start justify-center gap-4 lg:gap-6 z-10 overflow-y-auto">
        {/* Left Column: Noble Patrons Dais (Zero overflow, 2 in 1st row & 1 centered in 2nd row when 3 nobles) */}
        <aside
          className={`relative flex flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-[#070B14]/95 border border-amber-500/20 shadow-2xl backdrop-blur-md shrink-0 z-10 w-full ${
            state.nobles.length > 1
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
              {state.nobles.length} left
            </span>
          </div>

          {state.nobles.length === 0 ? (
            <div className="text-xs text-slate-500 font-['Cinzel'] p-6 text-center">
              All Nobles Claimed!
            </div>
          ) : (
            <div
              className={`w-full gap-2 ${
                state.nobles.length > 1 ? 'grid grid-cols-2' : 'flex flex-col'
              }`}
            >
              {state.nobles.map((noble, index) => {
                const isSingleLastInRow =
                  state.nobles.length > 1 &&
                  index === state.nobles.length - 1 &&
                  state.nobles.length % 2 === 1;

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
                      playerBonuses={humanBonuses}
                      compact={true}
                      className={isSingleLastInRow ? 'w-[calc(50%-4px)]' : 'w-full'}
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
          {([3, 2, 1] as const).map((tier) => {
            const faceUp = state.faceUpCards[tier] || [];
            const deckRemaining = state.decks[tier]?.length || 0;

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
                {/* Tier Deck Card Stack with minimalist reservation confirmation */}
                <div
                  onClick={() => {
                    if (!isHumanTurn) return;
                    if (humanPlayer.reservedCards.length >= 3) {
                      sound.playError();
                      return;
                    }
                    if (deckRemaining === 0) return;
                    setSelectedCardId(null);
                    setStagedGems([]);
                    sound.playTokenPickup();
                    setConfirmingDeckTier(confirmingDeckTier === tier ? null : tier);
                  }}
                  className={`relative shrink-0 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} w-14 sm:w-16 md:w-18 h-48 sm:h-52 md:h-56 lg:h-[216px] xl:h-[224px] flex flex-col items-center justify-center select-none shadow-md transition-all ${
                    confirmingDeckTier === tier
                      ? 'ring-2 ring-amber-400 bg-amber-950/80 z-30'
                      : isHumanTurn && humanPlayer.reservedCards.length < 3 && deckRemaining > 0
                      ? 'cursor-pointer hover:border-amber-400/80 hover:scale-102'
                      : 'cursor-default'
                  }`}
                  title={
                    isHumanTurn && humanPlayer.reservedCards.length < 3 && deckRemaining > 0
                      ? `Tier ${tier} Deck: ${deckRemaining} cards. Click to blind reserve (+1 Gold).`
                      : `Tier ${tier} Deck: ${deckRemaining} cards.`
                  }
                >
                  {confirmingDeckTier === tier ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 rounded-2xl bg-[#0B0F1A]/95 p-1.5 flex flex-col items-center justify-between text-center z-30 animate-fade-in"
                    >
                      <span className="font-['Cinzel'] font-bold text-amber-300 text-[10px] uppercase">
                        Reserve T{tier}
                      </span>
                      <span className="text-[9px] text-amber-200 font-bold">
                        +1 Gold 🪙
                      </span>
                      <div className="flex flex-col gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => handleReserveDeck(tier)}
                          className="w-full py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-['Cinzel'] font-black text-[10px] uppercase shadow cursor-pointer active:scale-95"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeckTier(null)}
                          className="w-full py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-['Cinzel'] text-[9px] uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${tierStyle.badge}`}>
                        {tierStyle.label}
                      </span>
                      <div className="text-base sm:text-lg font-bold font-mono text-white mt-1.5">
                        {deckRemaining}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-['Cinzel'] tracking-wider">
                        Cards
                      </div>
                    </>
                  )}
                </div>

                {/* 4 Face-Up Cards per Tier */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
                  {faceUp.map((card) => {
                    const affordability = isHumanTurn
                      ? checkCardAffordability(card, humanPlayer.tokens, humanBonuses)
                      : undefined;
                    const isSelected = selectedCardId === card.id;

                    return (
                      <div key={card.id} className="relative shrink-0">
                        <DevelopmentCardView
                          card={card}
                          affordability={affordability}
                          isSelected={isSelected}
                          disabled={!isHumanTurn}
                          canReserve={isHumanTurn && humanPlayer.reservedCards.length < 3}
                          onSelect={() => {
                            if (!isHumanTurn) return;
                            sound.playTokenPickup();
                            setConfirmingDeckTier(null);
                            setStagedGems([]);
                            setSelectedCardId(isSelected ? null : card.id);
                          }}
                          onBuy={() => handleBuyCard(card.id, false)}
                          onReserve={() => handleReserveCard(card.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Right Column: Player Game Details Scoreboard matching HostTableView */}
        <aside
          className="relative flex flex-col gap-2 w-full max-w-[270px] xl:max-w-[300px] shrink-0 z-10 justify-self-center lg:justify-self-start"
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
              Target: <b className="text-amber-300 font-mono">{state.targetVP}</b> VP
            </span>
          </div>

          {/* Player Cards (Human + AI Opponents) */}
          <div className="flex flex-col gap-2">
            {state.players.map((p, idx) => {
              const isActive = state.activePlayerIndex === idx;
              const isHuman = idx === 0;
              const bonuses = calculateBonuses(p.cards);

              return (
                <div
                  key={p.id || idx}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-[#121826] border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                      : 'bg-[#121826]/80 border-white/6 shadow-sm hover:border-white/15'
                  }`}
                >
                  {/* Player Header: Avatar, Name, VP score badge & Reserved Cards button */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/6">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg filter drop-shadow shrink-0">{p.avatar}</span>
                      <div className="min-w-0">
                        <div className="font-['Cinzel'] font-bold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isHuman && (
                            <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1 rounded-sm uppercase font-mono font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          {isActive ? (
                            <span className="text-amber-300 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Turn
                            </span>
                          ) : (
                            <span>Waiting</span>
                          )}

                          {/* Reserved cards badge / button */}
                          {p.reservedCards.length > 0 && (
                            <>
                              <span>•</span>
                              {isHuman ? (
                                <button
                                  type="button"
                                  onClick={() => setIsReservedDrawerOpen(true)}
                                  className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                  title="View your reserved cards"
                                >
                                  <Bookmark size={10} />
                                  <span>{p.reservedCards.length} Reserved</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-0.5">
                                  <Bookmark size={10} />
                                  <span>{p.reservedCards.length} Reserved</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VP Score Badge */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 shrink-0">
                      <Crown size={12} className="text-amber-400" />
                      <span className="font-['Cinzel'] font-black text-amber-300 text-xs sm:text-sm">
                        {p.prestigePoints}
                      </span>
                      <span className="text-[9px] text-amber-400/70 font-medium">
                        /{state.targetVP}
                      </span>
                    </div>
                  </div>

                  {/* UNIFIED BUYING POWER GRID (Tokens + Discounts in one box) */}
                  <div className="w-full">
                    <div className="grid grid-cols-6 gap-1 w-full">
                      {ALL_TOKENS.map((t) => {
                        const isGold = t === 'gold';
                        const tokenCount = p.tokens[t] || 0;
                        const bonusCount = !isGold ? bonuses[t as GemType] || 0 : 0;
                        const totalPower = tokenCount + bonusCount;
                        const hasPower = totalPower > 0;

                        return (
                          <div
                            key={t}
                            className={`relative flex flex-col items-center justify-between p-1 rounded-lg border transition-all ${
                              hasPower
                                ? isGold
                                  ? 'bg-amber-950/40 border-amber-500/40 shadow-sm'
                                  : 'bg-white/5 border-white/10 shadow-sm'
                                : 'bg-[#0B0F1A]/60 border-white/4 opacity-40'
                            }`}
                            title={
                              isGold
                                ? `Gold Joker: ${tokenCount} tokens`
                                : `${t}: ${totalPower} Total Buying Power (${tokenCount} tokens + ${bonusCount} discount cards)`
                            }
                          >
                            {/* Gem Symbol with Top-Right Discount Badge */}
                            <div className="relative flex items-center justify-center w-full mt-0.5">
                              <GemIcon
                                type={t}
                                size="xs"
                                variant={isGold ? 'chip' : 'gem'}
                                className="w-4 h-4"
                              />

                              {/* Top-Right Discount Badge (+1, +2) */}
                              {bonusCount > 0 && (
                                <span className="absolute -top-1.5 -right-1 px-0.8 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-[9px] leading-none shadow-sm border border-emerald-300">
                                  +{bonusCount}
                                </span>
                              )}
                            </div>

                            {/* Total Buying Power under Gem Symbol */}
                            <span
                              className={`font-mono font-black text-xs sm:text-sm leading-none mt-1.5 ${
                                hasPower
                                  ? isGold
                                    ? 'text-amber-300 font-black'
                                    : bonusCount > 0
                                    ? 'text-amber-100 font-black'
                                    : 'text-white'
                                  : 'text-slate-600'
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

      {/* Human Player Reserved Cards Drawer / Modal */}
      {isReservedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0F1A]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-xl w-full p-5 rounded-3xl bg-[#121826] border border-amber-400/40 shadow-2xl flex flex-col items-center relative">
            <button
              type="button"
              onClick={() => setIsReservedDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={20} className="text-amber-400" />
              <h2 className="font-['Cinzel'] font-black text-lg text-amber-200 tracking-wider">
                YOUR RESERVED CARDS ({humanPlayer.reservedCards.length}/3)
              </h2>
            </div>
            <p className="text-xs text-slate-400 text-center mb-4">
              Cards you held with +1 Gold joker. Buy them whenever you have enough buying power!
            </p>

            {humanPlayer.reservedCards.length === 0 ? (
              <div className="p-8 text-slate-500 font-['Cinzel'] text-sm text-center">
                You have no reserved cards. Click "Reserve" on any face-up card or Tier deck to reserve!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full justify-items-center">
                {humanPlayer.reservedCards.map((card) => {
                  const affordability = checkCardAffordability(
                    card,
                    humanPlayer.tokens,
                    humanBonuses
                  );

                  return (
                    <div key={card.id} className="flex flex-col items-center gap-2">
                      <DevelopmentCardView
                        card={card}
                        affordability={affordability}
                        disabled={!isHumanTurn}
                        canReserve={false}
                      />
                      {isHumanTurn && (
                        <button
                          type="button"
                          disabled={!affordability.canAfford}
                          onClick={() => handleBuyCard(card.id, true)}
                          className={`w-full py-1.5 px-3 rounded-xl font-['Cinzel'] font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            affordability.canAfford
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          {affordability.canAfford ? 'Buy Card' : 'Cannot Afford'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discard Tokens Modal (10-token rule enforcement) */}
      {state.pendingTokenDiscard && state.pendingTokenDiscard.playerIndex === 0 && (
        <DiscardTokensModal
          player={humanPlayer}
          countToDiscard={state.pendingTokenDiscard.countToDiscard}
          onConfirmDiscard={(tokens: Partial<TokenCount>) => {
            const res = executeDiscardTokens(state, 0, tokens);
            if (!res.error) {
              setState(res.nextState);
            }
          }}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Move History Modal */}
      <ActionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={state.log}
      />

      {/* Solo Match Settings Modal */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApplySettings={(newCfg) => {
          setIsSettingsOpen(false);
          handleResetMatch(newCfg);
        }}
        currentSettings={matchConfig}
      />

      {/* Turn Action Pop-Up after each completed move */}
      {turnActionPopup && (
        <TurnActionNotification
          log={turnActionPopup}
          playerAvatar={popupPlayer?.avatar}
          onDismiss={() => setTurnActionPopup(null)}
        />
      )}

      {/* Noble Claim Celebration Fanfare */}
      {celebratingNoble && (
        <NobleClaimCelebration
          noble={celebratingNoble.noble}
          playerName={celebratingNoble.playerName}
          isHuman={celebratingNoble.isHuman}
          onComplete={() => setCelebratingNoble(null)}
        />
      )}

      {/* Game Over Victory Banner */}
      {state.status === 'game_over' && (
        <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#121826] border border-amber-400/60 shadow-2xl flex flex-col items-center">
            <Trophy size={48} className="text-amber-400 animate-bounce mb-3" />
            <h2 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-200 tracking-wider">
              {state.winnerId === humanPlayer.id ? 'VICTORY ACHIEVED!' : 'MATCH CONCLUDED'}
            </h2>
            <p className="text-sm text-slate-300 mt-2 mb-4">
              {state.winnerId === humanPlayer.id
                ? 'Congratulations! You reached the prestige target and mastered the Renaissance gems!'
                : `${state.players.find((p) => p.id === state.winnerId)?.name} reached ${state.targetVP} Prestige Points.`}
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleResetMatch()}
                className="w-full py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                <span>Play Again</span>
              </button>

              <button
                type="button"
                onClick={onExitSolo}
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
