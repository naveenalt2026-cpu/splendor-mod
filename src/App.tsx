/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { GameState, GemType, TokenCount } from './types/game.ts';
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
import { Shield } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<GameState>(() =>
    createInitialGameState({ playerCount: 2, aiDifficulty: 'medium' })
  );

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [stagedGems, setStagedGems] = useState<GemType[]>([]);
  const [helperMessage, setHelperMessage] = useState<string>('SELECT A CARD TO BUY OR RESERVE');

  // Modals state
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [matchConfig, setMatchConfig] = useState({
    playerCount: 2,
    aiDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    targetVP: 15,
  });

  const activePlayer = state.players[state.activePlayerIndex];
  const isHumanTurn = state.activePlayerIndex === 0 && state.status !== 'game_over';
  const humanPlayer = state.players[0];
  const humanBonuses = calculateBonuses(humanPlayer.cards);

  // Clear selections when turn changes
  useEffect(() => {
    setSelectedCardId(null);
    setStagedGems([]);
    if (state.activePlayerIndex === 0) {
      sound.playTurnChime();
      setHelperMessage('YOUR TURN: SELECT A CARD OR CHOOSE GEMS');
    }
  }, [state.activePlayerIndex, state.turnCount]);

  // Check victory fanfare
  useEffect(() => {
    if (state.status === 'game_over') {
      sound.playVictory();
    }
  }, [state.status]);

  // Handle AI Turns with realistic pacing
  useEffect(() => {
    if (state.status === 'game_over') return;
    if (state.activePlayerIndex !== 0) {
      setHelperMessage(`${activePlayer.name.toUpperCase()} IS FORMULATING STRATEGY...`);
      const timer = setTimeout(() => {
        setState(prev => {
          if (prev.activePlayerIndex === 0 || prev.status === 'game_over') return prev;
          const next = executeAIMove(prev, prev.activePlayerIndex);
          sound.playTokenDrop();
          return next;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.activePlayerIndex, state.status, activePlayer.name]);

  // Handlers for Human Player actions
  const handleToggleStagedGem = (gem: GemType) => {
    if (!isHumanTurn) return;
    setSelectedCardId(null);
    sound.playTokenPickup();

    setStagedGems(prev => {
      // If clicking same gem again
      if (prev.includes(gem)) {
        // If it was already staged once and total count is 1
        if (prev.length === 1 && prev[0] === gem) {
          // Stage a 2nd if bank >= 4
          if ((state.bank[gem] || 0) >= 4) {
            setHelperMessage(`STAGED 2 ${gem.toUpperCase()} GEMS. CLICK COLLECT.`);
            return [gem, gem];
          } else {
            setHelperMessage(`CANNOT TAKE 2 ${gem.toUpperCase()}: BANK HAS LESS THAN 4.`);
            return [];
          }
        }
        // If already has 2 or in a set, remove this gem
        const filtered = prev.filter(g => g !== gem);
        setHelperMessage(filtered.length > 0 ? `COLLECTING ${filtered.length} GEMS` : 'SELECT GEMS OR A CARD');
        return filtered;
      }

      // If user had staged 2 of same gem, reset to start distinct selection
      if (prev.length === 2 && prev[0] === prev[1]) {
        return [gem];
      }

      // Max 3 distinct gems
      if (prev.length >= 3) {
        setHelperMessage('MAX 3 DIFFERENT GEMS ALLOWED PER TURN.');
        return prev;
      }

      const next = [...prev, gem];
      setHelperMessage(`STAGED ${next.length} GEMS (${next.join(', ')}). CLICK COLLECT.`);
      return next;
    });
  };

  const handleClearStaged = () => {
    setStagedGems([]);
    setHelperMessage('SELECT A CARD TO BUY OR RESERVE');
  };

  const handleConfirmTakeTokens = () => {
    if (!isHumanTurn || stagedGems.length === 0) return;
    const res = executeTakeTokens(state, 0, stagedGems);
    if (res.error) {
      setHelperMessage(`ERROR: ${res.error}`);
      return;
    }
    sound.playTokenDrop();
    setStagedGems([]);
    setState(res.nextState);
  };

  const handleBuyCard = (cardId: string, fromReserved = false) => {
    if (!isHumanTurn) return;
    const res = executeBuyCard(state, 0, cardId, fromReserved);
    if (res.error) {
      setHelperMessage(`ERROR: ${res.error}`);
      return;
    }
    sound.playBuyCard();
    setSelectedCardId(null);
    setState(res.nextState);
  };

  const handleReserveCard = (cardId: string) => {
    if (!isHumanTurn) return;
    const res = executeReserveCard(state, 0, cardId);
    if (res.error) {
      setHelperMessage(`ERROR: ${res.error}`);
      return;
    }
    sound.playReserveCard();
    setSelectedCardId(null);
    setState(res.nextState);
  };

  const handleReserveDeck = (tier: 1 | 2 | 3) => {
    if (!isHumanTurn) return;
    const res = executeReserveCard(state, 0, undefined, tier);
    if (res.error) {
      setHelperMessage(`ERROR: ${res.error}`);
      return;
    }
    sound.playReserveCard();
    setState(res.nextState);
  };

  const handleConfirmDiscard = (tokensToDiscard: Partial<TokenCount>) => {
    const res = executeDiscardTokens(state, 0, tokensToDiscard);
    if (res.error) {
      setHelperMessage(`ERROR: ${res.error}`);
      return;
    }
    sound.playTokenDrop();
    setState(res.nextState);
  };

  const handleResetGame = (config = matchConfig) => {
    const newState = createInitialGameState({
      playerCount: config.playerCount,
      aiDifficulty: config.aiDifficulty,
    });
    newState.targetVP = config.targetVP;
    setState(newState);
    setSelectedCardId(null);
    setStagedGems([]);
    setHelperMessage('MATCH STARTED: SELECT A CARD OR COLLECT GEMS');
  };

  const handlePassTurn = () => {
    if (!isHumanTurn) return;
    setState(prev => finalizeTurn(prev));
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-['Plus_Jakarta_Sans'] bg-slate-950 text-slate-100 select-none"
      style={{
        background: `
          radial-gradient(ellipse 95% 85% at 50% 45%, #0f172a 0%, #090d16 55%, #020408 100%)
        `,
      }}
    >
      {/* Mystical Cosmic Velvet & Arcane Energy Vortex (Direct Reference Match) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Central Arcane Table Light Bloom */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] lg:w-[1000px] h-[550px] lg:h-[700px] rounded-full opacity-30 filter blur-[80px]"
          style={{
            background: `radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(99,102,241,0.2) 35%, rgba(239,68,68,0.18) 70%, transparent 100%)`,
          }}
        />

        {/* Ethereal Rainbow Cosmic Energy Rings */}
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[750px] opacity-40 pointer-events-none"
          viewBox="0 0 1100 750"
        >
          <defs>
            <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing Arcane Trails */}
          <ellipse
            cx="550"
            cy="375"
            rx="460"
            ry="280"
            fill="none"
            stroke="url(#orbitGrad1)"
            strokeWidth="2.5"
            filter="url(#glowFilter)"
            strokeDasharray="600 30"
          />
          <ellipse
            cx="550"
            cy="375"
            rx="480"
            ry="295"
            fill="none"
            stroke="url(#orbitGrad2)"
            strokeWidth="1.5"
            strokeDasharray="400 120"
            opacity="0.6"
          />

          {/* Starlight Sparkles */}
          <circle cx="280" cy="220" r="3" fill="#ffffff" filter="url(#glowFilter)" />
          <circle cx="820" cy="240" r="3" fill="#fde047" filter="url(#glowFilter)" />
          <circle cx="690" cy="540" r="2.5" fill="#38bdf8" filter="url(#glowFilter)" />
          <circle cx="360" cy="500" r="2.5" fill="#f43f5e" filter="url(#glowFilter)" />
        </svg>
      </div>

      {/* Top HUD */}
      <TopHUD
        state={state}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetGame={() => handleResetGame()}
        helperText={helperMessage}
      />

      {/* Main Playing Arena - Fully Responsive */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-3 lg:gap-4 z-10 overflow-y-auto">
        {/* Left Side: 3D-styled Gem Bank Chip Stacks */}
        <div className="flex lg:flex-col items-center justify-center shrink-0 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <GemChipRack
            bank={state.bank}
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
            const faceUp = state.faceUpCards[tier];
            const deckRemaining = state.decks[tier].length;

            return (
              <div key={tier} className="relative flex items-center justify-center gap-2 sm:gap-3 min-w-[580px] sm:min-w-0 w-full">
                {/* Tier Deck Stack with Card Back */}
                <div
                  onClick={() => isHumanTurn && handleReserveDeck(tier)}
                  className={`relative shrink-0 rounded-xl border-2 flex flex-col items-center justify-center select-none shadow-xl transition-all ${
                    tier === 3
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
                >
                  <div className="font-['Cinzel'] font-black text-amber-300 text-sm sm:text-base">
                    T{tier}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-200 mt-1">
                    {deckRemaining}
                  </div>
                  <div className="text-[9px] text-amber-200/70 uppercase font-['Cinzel'] mt-0.5">
                    Cards
                  </div>
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
                          canReserve={humanPlayer.reservedCards.length < 3}
                          onSelect={() => {
                            if (!isHumanTurn) return;
                            setStagedGems([]);
                            setSelectedCardId(isSelected ? null : card.id);
                            sound.playTokenPickup();
                            setHelperMessage(
                              affordability.canAfford
                                ? `CARD READY! CLICK BUY OR RESERVE.`
                                : `NEEDS ${affordability.missingGemsCount} MORE GEMS TO BUY.`
                            );
                          }}
                          onBuy={() => handleBuyCard(card.id)}
                          onReserve={() => handleReserveCard(card.id)}
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

        {/* Right Side: Ornate Stone Dais for Noble Patrons */}
        <aside
          className="relative flex lg:flex-col items-center justify-start p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-md shrink-0 z-10 w-full lg:w-auto overflow-x-auto lg:overflow-y-auto max-h-none lg:max-h-[500px]"
          aria-label="Noble Patrons Dais"
        >
          {/* Dais Header */}
          <div className="flex lg:flex-col items-center gap-1.5 mb-2 shrink-0 pr-3 lg:pr-0 border-r lg:border-r-0 border-slate-800">
            <div className="font-['Cinzel'] font-bold text-amber-200/90 text-xs tracking-wider uppercase flex items-center gap-1">
              <Shield size={14} className="text-amber-400" />
              <span>Nobles</span>
            </div>
            <div className="text-[10px] text-slate-400 text-center hidden lg:block max-w-[100px]">
              +3 VP on bonus match
            </div>
          </div>

          {/* Noble Tiles Stack */}
          <div className="flex lg:flex-col gap-2 sm:gap-2.5 items-center shrink-0">
            {state.nobles.length === 0 ? (
              <div className="text-[11px] text-slate-500 font-['Cinzel'] p-3 text-center">
                All Claimed!
              </div>
            ) : (
              state.nobles.map(noble => (
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

      {/* Floating Big Glowing "END TURN" / "PASS" Action Orb on Bottom Left */}
      <div className="fixed bottom-20 sm:bottom-22 left-3 sm:left-5 z-30">
        <button
          type="button"
          onClick={handlePassTurn}
          disabled={!isHumanTurn}
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl transition-all duration-300 ${
            isHumanTurn
              ? 'border-cyan-400 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-cyan-200 hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300'
              : 'border-slate-800 bg-slate-950/80 text-slate-600 cursor-not-allowed'
          }`}
          title="Pass turn without taking an action"
          aria-label="Pass Turn"
        >
          <div className="absolute inset-1 rounded-full border border-dashed border-cyan-400/40 pointer-events-none" />
          <span className="font-['Cinzel'] font-black text-[10px] sm:text-[11px] tracking-wider uppercase drop-shadow">
            END
          </span>
          <span className="font-['Cinzel'] font-black text-[10px] sm:text-[11px] tracking-wider uppercase drop-shadow text-amber-300">
            TURN
          </span>
        </button>
      </div>

      {/* Bottom Tableau: Player's Permanent Engine, Token Pouch, and Reserved Cards */}
      <BottomPlayerTableau
        player={humanPlayer}
        isMyTurn={isHumanTurn}
        onBuyCard={(cardId, fromReserved) => handleBuyCard(cardId, fromReserved)}
        onReserveDeck={handleReserveDeck}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        deckCounts={{
          1: state.decks[1].length,
          2: state.decks[2].length,
          3: state.decks[3].length,
        }}
      />

      {/* Modals & Overlays */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <ActionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={state.log}
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

      {state.pendingTokenDiscard && state.pendingTokenDiscard.playerIndex === 0 && (
        <DiscardTokensModal
          player={humanPlayer}
          countToDiscard={state.pendingTokenDiscard.countToDiscard}
          onConfirmDiscard={handleConfirmDiscard}
        />
      )}

      <GameOverModal state={state} onRestart={() => handleResetGame()} />
    </div>
  );
}
