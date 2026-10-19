/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { GameState, GemType, TokenCount, NobleTile } from './types/game.ts';
import {
  calculateBonuses,
  checkCardAffordability,
  createInitialGameState,
  executeBuyCard,
  executeDiscardTokens,
  executeReserveCard,
  executeTakeTokens,
  finalizeTurn,
} from './game/rules.ts';
import { executeAIMove } from './game/ai.ts';
import { sound } from './game/sound.ts';
import { TopHUD } from './components/TopHUD.tsx';
import { GemChipRack } from './components/GemChipRack.tsx';
import { DevelopmentCardView } from './components/DevelopmentCardView.tsx';
import { NobleTileView } from './components/NobleTileView.tsx';
import { BottomPlayerTableau } from './components/BottomPlayerTableau.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { ActionHistoryModal } from './components/ActionHistoryModal.tsx';
import { DiscardTokensModal } from './components/DiscardTokensModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { GameSettingsModal } from './components/GameSettingsModal.tsx';
import { NobleClaimCelebration } from './components/NobleClaimCelebration.tsx';
import { Shield, Sparkles, Check, X, Tv, Smartphone, Crown, Users } from 'lucide-react';
import { useMultiplayerSocket } from './hooks/useMultiplayerSocket.ts';
import { HostLobbyView } from './components/HostLobbyView.tsx';
import { HostTableView } from './components/HostTableView.tsx';
import { MobilePlayerView } from './components/MobilePlayerView.tsx';
import { MobileJoinScreen } from './components/MobileJoinScreen.tsx';
import { MobileLobbyWaiting } from './components/MobileLobbyWaiting.tsx';
import { MobileReconnectingScreen } from './components/MobileReconnectingScreen.tsx';
import { getStoredHostSession, getStoredPlayerSession } from './utils/sessionStorage.ts';

type AppMode = 'choose_mode' | 'host' | 'player' | 'solo';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');
  const roleParam = urlParams.get('role');

  const [mode, setMode] = useState<AppMode>(() => {
    const storedPlayer = getStoredPlayerSession();
    const storedHost = getStoredHostSession();
    if (sessionParam && roleParam === 'player') return 'player';
    if (roleParam === 'host') return 'host';
    if (sessionParam) return 'player';
    if (storedPlayer && storedPlayer.sessionId) return 'player';
    if (storedHost && storedHost.sessionId) return 'host';
    return 'choose_mode';
  });

  // Multiplayer WebSocket Hook
  const {
    isConnected,
    isReconnecting,
    sessionId,
    joinUrl,
    myPlayerId,
    myPlayerIndex,
    publicState,
    privateState,
    lobbyPlayers,
    canStart,
    errorMessage,
    storedPlayerSession,
    createHostSession,
    createNewHostRoom,
    closeHostSession,
    joinSession,
    leaveSession,
    reconnectManual,
    addAIPlayer,
    startHostGame,
    restartHostGame,
    sendGameAction,
  } = useMultiplayerSocket();

  // Initialize Host Session when entering host mode if none exists
  useEffect(() => {
    if (mode === 'host' && !sessionId) {
      createHostSession(15);
    }
  }, [mode, sessionId, createHostSession]);

  // Solo local game state
  const [soloState, setSoloState] = useState<GameState>(() =>
    createInitialGameState({ playerCount: 2, aiDifficulty: 'medium' })
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [stagedGems, setStagedGems] = useState<GemType[]>([]);
  const [confirmingDeckTier, setConfirmingDeckTier] = useState<1 | 2 | 3 | null>(null);
  const [helperMessage, setHelperMessage] = useState<string>('SELECT A CARD TO BUY OR RESERVE');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [celebratingNoble, setCelebratingNoble] = useState<{
    noble: NobleTile;
    playerName: string;
    isHuman: boolean;
  } | null>(null);
  const [matchConfig, setMatchConfig] = useState({
    playerCount: 2,
    aiDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    targetVP: 15,
  });

  const activePlayer = soloState.players[soloState.activePlayerIndex];
  const isHumanTurn = soloState.activePlayerIndex === 0 && soloState.status !== 'game_over';
  const humanPlayer = soloState.players[0];
  const humanBonuses = calculateBonuses(humanPlayer.cards);

  // Solo mode AI turn progression
  useEffect(() => {
    if (mode !== 'solo' || soloState.status === 'game_over') return;
    if (soloState.activePlayerIndex !== 0) {
      setConfirmingDeckTier(null);
      setHelperMessage(`${activePlayer.name.toUpperCase()} IS FORMULATING STRATEGY...`);
      const timer = setTimeout(() => {
        setSoloState(prev => {
          if (prev.activePlayerIndex === 0 || prev.status === 'game_over') return prev;
          const next = executeAIMove(prev, prev.activePlayerIndex);
          sound.playTokenDrop();
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, soloState.activePlayerIndex, soloState.status, activePlayer.name]);

  // Solo mode turn resets
  useEffect(() => {
    if (mode !== 'solo') return;
    setSelectedCardId(null);
    setStagedGems([]);
    setConfirmingDeckTier(null);
    if (soloState.activePlayerIndex === 0) {
      sound.playTurnChime();
      setHelperMessage('YOUR TURN: SELECT A CARD OR CHOOSE GEMS');
    }
  }, [mode, soloState.activePlayerIndex, soloState.turnCount]);

  // Handle Solo actions
  const handleToggleStagedGem = (gem: GemType) => {
    if (!isHumanTurn) return;
    setSelectedCardId(null);
    setConfirmingDeckTier(null);
    sound.playTokenPickup();
    setStagedGems(prev => {
      if (prev.includes(gem)) {
        if (prev.filter(g => g === gem).length === 1 && prev.length === 1) return [gem, gem];
        return prev.filter(g => g !== gem);
      }
      if (prev.length >= 3) return prev;
      return [...prev, gem];
    });
  };

  const handleClearStaged = () => setStagedGems([]);

  const handleConfirmTakeTokens = () => {
    if (!isHumanTurn || stagedGems.length === 0) return;
    const res = executeTakeTokens(soloState, 0, stagedGems);
    if (res.error) {
      setHelperMessage(res.error.toUpperCase());
      sound.playError();
      return;
    }
    sound.playTokenDrop();
    setStagedGems([]);
    setSoloState(res.nextState);
  };

  const handleBuyCard = (cardId: string, fromReserved = false) => {
    if (!isHumanTurn) return;
    const res = executeBuyCard(soloState, 0, cardId, fromReserved);
    if (res.error) {
      setHelperMessage(res.error.toUpperCase());
      sound.playError();
      return;
    }
    sound.playBuyCard();
    setSelectedCardId(null);
    setSoloState(res.nextState);
  };

  const handleReserveDeck = (tier: 1 | 2 | 3) => {
    if (!isHumanTurn) return;
    const res = executeReserveCard(soloState, 0, undefined, tier);
    if (res.error) {
      setHelperMessage(res.error.toUpperCase());
      sound.playError();
      return;
    }
    sound.playTokenPickup();
    setConfirmingDeckTier(null);
    setSoloState(res.nextState);
  };

  const handleConfirmDiscard = (tokensToDiscard: Partial<TokenCount>) => {
    const res = executeDiscardTokens(soloState, 0, tokensToDiscard);
    if (res.error) {
      sound.playError();
      return;
    }
    sound.playTokenDrop();
    setSoloState(res.nextState);
  };

  const handleResetGame = (newConfig = matchConfig) => {
    setSoloState(createInitialGameState(newConfig));
    setSelectedCardId(null);
    setStagedGems([]);
    setConfirmingDeckTier(null);
    setHelperMessage('MATCH COMMENCED. FIRST TO 15 VP WINS.');
  };

  // -------------------------------------------------------------
  // ROUTE 1: Dedicated Host View (Central Shared Board on TV/Tablet)
  // -------------------------------------------------------------
  if (mode === 'host') {
    // If game has not started yet, show Host Lobby with Large QR Code
    if (!publicState || publicState.status === 'lobby') {
      return (
        <HostLobbyView
          sessionId={sessionId || 'INITIALIZING...'}
          joinUrl={joinUrl || `${window.location.origin}/?session=${sessionId || ''}&role=player`}
          players={lobbyPlayers}
          canStart={canStart}
          onStartGame={startHostGame}
          onAddAI={() => addAIPlayer('medium')}
          onCreateNewRoom={() => createNewHostRoom(15)}
          onExitHost={() => {
            closeHostSession();
            setMode('choose_mode');
          }}
        />
      );
    }

    // Permanent "Table View" (Central Shared Board)
    return (
      <HostTableView
        publicState={publicState}
        onRestartMatch={restartHostGame}
        onCreateNewRoom={() => createNewHostRoom(15)}
        onExitHost={() => {
          closeHostSession();
          setMode('choose_mode');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // ROUTE 2: Mobile Player View (Personal handheld controller)
  // -------------------------------------------------------------
  if (mode === 'player') {
    // If currently reconnecting to a known session, display sleek Reconnection Screen
    if (
      (isReconnecting || (storedPlayerSession && !publicState)) &&
      (sessionId || storedPlayerSession?.sessionId)
    ) {
      return (
        <MobileReconnectingScreen
          sessionId={sessionId || storedPlayerSession?.sessionId || ''}
          playerName={storedPlayerSession?.playerName || 'Player'}
          avatar={storedPlayerSession?.avatar || '👑'}
          errorMessage={errorMessage}
          onCancel={() => {
            leaveSession();
            setMode('choose_mode');
          }}
          onManualRetry={reconnectManual}
        />
      );
    }

    // If not connected to a session yet, show Mobile Join Screen
    if (!myPlayerId || !publicState || myPlayerIndex === null) {
      return (
        <MobileJoinScreen
          initialSessionId={sessionParam || sessionId || ''}
          onJoin={(sCode, name, avatar) => {
            joinSession(sCode, name, avatar);
          }}
          onSwitchToHost={() => setMode('host')}
        />
      );
    }

    // If game has not started yet, show Mobile Lobby Waiting screen
    if (publicState.status === 'lobby') {
      const myPlayer = publicState.players[myPlayerIndex];
      return (
        <MobileLobbyWaiting
          sessionId={publicState.sessionId}
          myPlayerName={myPlayer?.name || 'Player'}
          myAvatar={myPlayer?.avatar || '👑'}
          myPlayerIndex={myPlayerIndex}
          lobbyPlayers={
            lobbyPlayers.length > 0
              ? lobbyPlayers
              : publicState.players.map((p, idx) => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar,
                  isAI: p.isAI,
                  connected: p.connected,
                  playerIndex: idx,
                }))
          }
          onLeave={() => {
            leaveSession();
            setMode('choose_mode');
          }}
        />
      );
    }

    // Handheld focused player interface during active match
    return (
      <MobilePlayerView
        publicState={publicState}
        privateState={privateState}
        myPlayerId={myPlayerId}
        myPlayerIndex={myPlayerIndex}
        onSendAction={sendGameAction}
        errorMessage={errorMessage}
        isConnected={isConnected}
        onLeaveGame={() => {
          leaveSession();
          setMode('choose_mode');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // ROUTE 3: Initial Mode Chooser (Welcome Screen)
  // -------------------------------------------------------------
  if (mode === 'choose_mode') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-[#121826] border border-white/8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] mb-4">
            <Crown size={32} className="stroke-[2.5]" />
          </div>

          <h1 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-200 tracking-wider">
            SPLENDOR
          </h1>
          <p className="font-['Cinzel'] font-bold text-xs sm:text-sm text-amber-400/90 tracking-widest uppercase mt-0.5 mb-6">
            Renaissance Gem Masters • Multiplayer Experience
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-8">
            Experience authentic tabletop Splendor where one screen acts as the dedicated Host board, and all players connect via mobile phones.
          </p>

          {/* 3 Main Mode Selection Tiles */}
          <div className="flex flex-col gap-3.5 w-full">
            {/* 1. Host Mode (Featured Primary Option) */}
            <button
              type="button"
              onClick={() => {
                setMode('host');
                createHostSession(15);
              }}
              className="w-full p-4 rounded-2xl bg-[#0B0F1A] hover:bg-[#0B0F1A]/80 border border-amber-500/40 hover:border-amber-400 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow">
                <Tv size={24} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-black text-base text-amber-200 group-hover:text-amber-100 flex items-center gap-2">
                  <span>START HOST TABLE VIEW</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                    TV / Table
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Creates room & displays large QR code for mobile phones to scan and join.
                </div>
              </div>
            </button>

            {/* 2. Join as Mobile Player */}
            <button
              type="button"
              onClick={() => setMode('player')}
              className="w-full p-4 rounded-2xl bg-[#0B0F1A] hover:bg-white/5 border border-white/8 hover:border-amber-400/50 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-white/10">
                <Smartphone size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-black text-base text-slate-200 group-hover:text-amber-200">
                  JOIN ON MOBILE
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Enter 6-letter room code or join directly via scanned QR code.
                </div>
              </div>
            </button>

            {/* 3. Solo Practice vs AI */}
            <button
              type="button"
              onClick={() => setMode('solo')}
              className="w-full p-3.5 rounded-2xl bg-[#0B0F1A]/60 hover:bg-white/5 border border-white/5 hover:border-white/15 flex items-center gap-4 transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 border border-white/5">
                <Users size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-bold text-sm text-slate-300 group-hover:text-amber-200">
                  Solo Practice vs AI
                </div>
                <div className="text-xs text-slate-500">
                  Single-device mode against computer opponents.
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ROUTE 4: Solo Practice vs AI (Single Device)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between p-3 sm:p-4 lg:p-6 select-none relative overflow-x-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Bar HUD */}
      <TopHUD
        state={soloState}
        helperText={helperMessage}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetGame={() => handleResetGame()}
      />

      {/* Switch to Multiplayer prompt banner */}
      <div className="max-w-7xl w-full mx-auto px-2 flex justify-end z-20">
        <button
          type="button"
          onClick={() => setMode('choose_mode')}
          className="text-[11px] font-['Cinzel'] font-bold text-amber-300 hover:text-amber-100 bg-amber-950/70 border border-amber-500/50 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Tv size={12} />
          <span>Switch to Multi-Device Host Mode</span>
        </button>
      </div>

      {/* Main Playing Arena */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-3 lg:gap-4 z-10 overflow-y-auto">
        {/* Left Side: 3D Gem Bank Chip Stacks */}
        <div className="flex lg:flex-col items-center justify-center shrink-0 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <GemChipRack
            bank={soloState.bank}
            stagedGems={stagedGems}
            onToggleStagedGem={handleToggleStagedGem}
            onClearStaged={handleClearStaged}
            onConfirmTake={handleConfirmTakeTokens}
            disabled={!isHumanTurn}
          />
        </div>

        {/* Center Arena: 3 Tiers of Development Cards Grid */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-4xl mx-auto overflow-x-auto pb-1">
          {([3, 2, 1] as const).map(tier => {
            const faceUp = soloState.faceUpCards[tier];
            const deckRemaining = soloState.decks[tier].length;

            return (
              <div key={tier} className="relative flex items-center justify-center gap-2 sm:gap-3 min-w-[580px] sm:min-w-0 w-full">
                {/* Tier Deck Stack with Card Back & On-Card Minimalist Confirmation */}
                <div
                  onClick={() => {
                    if (!isHumanTurn) return;
                    if (humanPlayer.reservedCards.length >= 3) {
                      setHelperMessage('CANNOT RESERVE: RESERVED HAND IS FULL (MAX 3 CARDS).');
                      return;
                    }
                    if (deckRemaining === 0) {
                      setHelperMessage(`TIER ${tier} DECK IS EMPTY.`);
                      return;
                    }
                    setSelectedCardId(null);
                    setStagedGems([]);
                    sound.playTokenPickup();
                    const nextTier = confirmingDeckTier === tier ? null : tier;
                    setConfirmingDeckTier(nextTier);
                    setHelperMessage(
                      nextTier
                        ? `RESERVE TIER ${tier} CARD FROM DECK (+1 GOLD)? CONFIRM ON THE DECK.`
                        : 'SELECT A CARD TO BUY OR RESERVE'
                    );
                  }}
                  className={`relative shrink-0 rounded-xl border-2 flex flex-col items-center justify-center select-none shadow-xl transition-all ${
                    confirmingDeckTier === tier
                      ? 'w-20 sm:w-24 md:w-26 h-36 sm:h-40 md:h-44 border-amber-300 ring-4 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.8)] scale-105 z-30'
                      : tier === 3
                      ? 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-amber-400/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 shadow-indigo-950/80'
                      : tier === 2
                      ? 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-sky-400/70 bg-gradient-to-br from-cyan-950 via-slate-900 to-sky-900 shadow-cyan-950/80'
                      : 'w-16 sm:w-20 md:w-22 h-36 sm:h-40 md:h-44 border-emerald-400/70 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900 shadow-emerald-950/80'
                  } ${
                    isHumanTurn && humanPlayer.reservedCards.length < 3 && deckRemaining > 0
                      ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-300'
                      : 'cursor-default opacity-85'
                  }`}
                  title={`Tier ${tier} Deck: ${deckRemaining} cards remaining. Click to blind reserve.`}
                  role="button"
                  aria-label={`Tier ${tier} Deck: ${deckRemaining} cards remaining`}
                >
                  {confirmingDeckTier === tier ? (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute inset-0 rounded-xl bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-between p-2 z-30 animate-fade-in"
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="font-['Cinzel'] font-bold text-amber-300 text-[10px] sm:text-xs uppercase tracking-wider">
                          Reserve T{tier}
                        </span>
                        <span className="text-[10px] text-amber-200 font-bold mt-0.5 flex items-center gap-0.5">
                          <span>+1 Gold</span>
                          <span className="text-yellow-400">🪙</span>
                        </span>
                      </div>

                      <div className="text-center my-0.5">
                        <span className="text-[9px] font-['Cinzel'] text-slate-300 font-semibold uppercase block">
                          Confirm?
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmingDeckTier(null);
                            handleReserveDeck(tier);
                          }}
                          className="flex-1 py-1 sm:py-1.5 px-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-['Cinzel'] font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer active:scale-95 ring-1 ring-emerald-300"
                          title="Confirm blind reservation"
                          aria-label={`Confirm reserve Tier ${tier} deck`}
                        >
                          <Check size={12} className="stroke-[3]" />
                          <span>YES</span>
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmingDeckTier(null);
                          }}
                          className="py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-['Cinzel'] text-[10px] sm:text-xs flex items-center justify-center shadow transition-all cursor-pointer"
                          title="Cancel"
                          aria-label="Cancel reserve"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base">
                        T{tier}
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-200 mt-1">
                        {deckRemaining}
                      </div>
                      <div className="text-[9px] text-amber-200/70 uppercase font-['Cinzel'] mt-0.5">
                        Cards
                      </div>
                    </>
                  )}
                </div>

                {/* 4 Face-Up Cards per Tier */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 flex-1">
                  {faceUp.map(card => {
                    const affordability = checkCardAffordability(
                      card,
                      humanPlayer.tokens,
                      humanBonuses
                    );
                    const isSelected = selectedCardId === card.id;

                    return (
                      <div key={card.id} className="relative flex justify-center">
                        <DevelopmentCardView
                          card={card}
                          affordability={affordability}
                          isSelected={isSelected}
                          onSelect={() => {
                            if (!isHumanTurn) return;
                            setSelectedCardId(isSelected ? null : card.id);
                            setStagedGems([]);
                            setConfirmingDeckTier(null);
                            sound.playTokenPickup();
                            setHelperMessage(
                              isSelected
                                ? 'YOUR TURN: SELECT A CARD OR CHOOSE GEMS'
                                : `SELECTED: ${card.name.toUpperCase()} (+${card.prestigePoints} VP)`
                            );
                          }}
                          onBuy={() => handleBuyCard(card.id, false)}
                          onReserve={() => {
                            if (!isHumanTurn) return;
                            const res = executeReserveCard(soloState, 0, card.id);
                            if (res.error) {
                              setHelperMessage(res.error.toUpperCase());
                              sound.playError();
                              return;
                            }
                            sound.playTokenPickup();
                            setSelectedCardId(null);
                            setSoloState(res.nextState);
                          }}
                          disabled={!isHumanTurn}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Ornate Nobles Dais */}
        <aside
          className="relative flex lg:flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-md shrink-0 z-10 w-full lg:w-auto overflow-x-auto lg:overflow-y-auto max-h-none lg:max-h-[calc(100vh-140px)]"
          aria-label="Noble Patrons Dais"
        >
          <div className="flex lg:flex-col items-center gap-1.5 mb-2 shrink-0 pr-3 lg:pr-0 border-r lg:border-r-0 border-slate-800">
            <div className="font-['Cinzel'] font-bold text-amber-200/90 text-xs tracking-wider uppercase flex items-center gap-1">
              <Shield size={14} className="text-amber-400" />
              <span>Nobles</span>
            </div>
            <div className="text-[10px] text-slate-400 text-center hidden lg:block max-w-[100px]">
              +3 VP on bonus match
            </div>
            <button
              type="button"
              onClick={() => {
                const sampleNoble = soloState.nobles[0] || {
                  id: 'noble_catherine',
                  name: 'Catherine de Medici',
                  prestigePoints: 3,
                  requirements: { ruby: 3, emerald: 3, diamond: 3 },
                  avatar: '👑',
                  flavorText: 'Patroness of the French Renaissance court and master gem collector.',
                };
                setSoloState(prev => ({
                  ...prev,
                  players: prev.players.map((p, idx) =>
                    idx === 0 && !p.nobles.some(n => n.id === sampleNoble.id)
                      ? { ...p, nobles: [...p.nobles, sampleNoble], prestigePoints: p.prestigePoints + 3 }
                      : p
                  ),
                }));
                setCelebratingNoble({
                  noble: sampleNoble,
                  playerName: humanPlayer.name,
                  isHuman: true,
                });
              }}
              className="mt-0.5 text-[9px] font-['Cinzel'] font-bold text-amber-300 hover:text-amber-100 flex items-center gap-1 bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded-full hover:scale-105 transition-all cursor-pointer shadow"
              title="Preview celebratory noble patron claim animation"
              aria-label="Preview Noble Celebration"
            >
              <Sparkles size={10} className="text-amber-400" />
              <span>Preview</span>
            </button>
          </div>

          <div className="flex lg:flex-col gap-2 sm:gap-2.5 items-center shrink-0">
            {soloState.nobles.length === 0 ? (
              <div className="text-[11px] text-slate-500 font-['Cinzel'] p-3 text-center">
                All Claimed!
              </div>
            ) : (
              soloState.nobles.map(noble => (
                <NobleTileView
                  key={noble.id}
                  noble={noble}
                  playerBonuses={humanBonuses}
                />
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Floating End Turn button */}
      <div className="fixed bottom-24 sm:bottom-28 left-4 sm:left-6 z-30">
        <button
          type="button"
          onClick={() => {
            if (!isHumanTurn) return;
            sound.playTurnChime();
            setSoloState(prev => finalizeTurn(prev));
          }}
          disabled={!isHumanTurn}
          className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-all ${
            isHumanTurn
              ? 'bg-gradient-to-b from-cyan-950 via-slate-900 to-black border-cyan-400/90 text-cyan-200 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer'
              : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
          }`}
          title="Pass turn to next player"
          aria-label="Pass Turn"
        >
          <span className="font-['Cinzel'] font-bold text-[9px] sm:text-[10px] tracking-wider uppercase text-cyan-300">
            END
          </span>
          <span className="font-['Cinzel'] font-black text-[10px] sm:text-[11px] tracking-wider uppercase drop-shadow text-amber-300">
            TURN
          </span>
        </button>
      </div>

      {/* Bottom Tableau */}
      <BottomPlayerTableau
        player={humanPlayer}
        isMyTurn={isHumanTurn}
        onBuyCard={(cardId, fromReserved) => handleBuyCard(cardId, fromReserved)}
        onReserveDeck={handleReserveDeck}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        deckCounts={{
          1: soloState.decks[1].length,
          2: soloState.decks[2].length,
          3: soloState.decks[3].length,
        }}
      />

      {/* Modals & Overlays */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <ActionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={soloState.log}
      />
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={matchConfig}
        onApplySettings={newConfig => {
          setMatchConfig(newConfig);
          handleResetGame(newConfig);
        }}
      />

      {soloState.pendingTokenDiscard && soloState.pendingTokenDiscard.playerIndex === 0 && (
        <DiscardTokensModal
          player={humanPlayer}
          countToDiscard={soloState.pendingTokenDiscard.countToDiscard}
          onConfirmDiscard={handleConfirmDiscard}
        />
      )}

      <GameOverModal state={soloState} onRestart={() => handleResetGame()} />

      {celebratingNoble && (
        <NobleClaimCelebration
          noble={celebratingNoble.noble}
          playerName={celebratingNoble.playerName}
          isHuman={celebratingNoble.isHuman}
          onComplete={() => setCelebratingNoble(null)}
        />
      )}
    </div>
  );
}
