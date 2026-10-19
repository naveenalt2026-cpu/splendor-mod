import React, { useState } from 'react';
import { ClientGameAction, PrivatePlayerState, PublicGameState } from '../types/multiplayer.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { calculateBonuses, canTakeTokens, checkCardAffordability } from '../game/rules.ts';
import { GemType, TokenType } from '../types/game.ts';
import {
  Crown,
  Sparkles,
  Coins,
  ShoppingBag,
  BookmarkPlus,
  Tv,
  Smartphone,
  Check,
  X,
  AlertCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { sound } from '../game/sound.ts';
import { DiscardTokensModal } from './DiscardTokensModal.tsx';
import { NobleTileView } from './NobleTileView.tsx';

interface MobilePlayerViewProps {
  publicState: PublicGameState;
  privateState: PrivatePlayerState | null;
  myPlayerId: string;
  myPlayerIndex: number;
  onSendAction: (action: ClientGameAction) => void;
  errorMessage: string | null;
}

export const MobilePlayerView: React.FC<MobilePlayerViewProps> = ({
  publicState,
  privateState,
  myPlayerId,
  myPlayerIndex,
  onSendAction,
  errorMessage,
}) => {
  // Navigation view: 'personal' (My hand & actions) vs 'table' (Shared board)
  const [activeTab, setActiveTab] = useState<'personal' | 'table'>('personal');
  // Staged action mode
  const [actionMode, setActionMode] = useState<'none' | 'take_gems' | 'buy_market' | 'reserve'>('none');
  // Staged gems for token collection
  const [stagedGems, setStagedGems] = useState<GemType[]>([]);
  // Selected card id on market table
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const myPlayer = publicState.players[myPlayerIndex] || publicState.players.find(p => p.id === myPlayerId);
  const isMyTurn = publicState.activePlayerIndex === myPlayerIndex && publicState.status !== 'game_over';
  const activePlayer = publicState.players[publicState.activePlayerIndex];

  const bonuses = myPlayer ? calculateBonuses(myPlayer.cards) : { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 };
  const totalTokens = myPlayer ? Object.values(myPlayer.tokens).reduce((acc, c) => acc + c, 0) : 0;
  const reservedCards = privateState?.reservedCards || [];

  // Toggle staged gem
  const handleToggleGem = (gem: GemType) => {
    sound.playTokenPickup();
    setStagedGems(prev => {
      // If 1 of this gem already staged:
      if (prev.includes(gem)) {
        if (prev.filter(g => g === gem).length === 1 && prev.length === 1) {
          // Double up on same gem (valid if bank has >= 4)
          return [gem, gem];
        }
        // Otherwise remove
        return prev.filter(g => g !== gem);
      }
      if (prev.length >= 3) return prev;
      return [...prev, gem];
    });
  };

  // Submit gem collection
  const handleConfirmTakeGems = () => {
    const val = canTakeTokens(stagedGems, publicState.bank);
    if (!val.valid) return;
    sound.playTokenDrop();
    onSendAction({ type: 'take_tokens', gems: stagedGems });
    setStagedGems([]);
    setActionMode('none');
  };

  // Submit buy card
  const handleBuyCard = (cardId: string, fromReserved = false) => {
    sound.playBuyCard();
    onSendAction({ type: 'buy_card', cardId, fromReserved });
    setSelectedCardId(null);
    setActionMode('none');
  };

  // Submit reserve card
  const handleReserveCard = (cardId: string) => {
    sound.playTokenPickup();
    onSendAction({ type: 'reserve_card', cardId });
    setSelectedCardId(null);
    setActionMode('none');
  };

  // Submit blind deck reserve
  const handleReserveDeck = (tier: 1 | 2 | 3) => {
    sound.playTokenPickup();
    onSendAction({ type: 'reserve_deck', tier });
    setActionMode('none');
  };

  const gemValidation = canTakeTokens(stagedGems, publicState.bank);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none relative overflow-x-hidden font-sans pb-16">
      {/* Top Header: Player profile & View toggle */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-amber-500/30 px-3 py-2.5 backdrop-blur-md shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* My Player Info */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{myPlayer?.avatar || '👑'}</span>
            <div>
              <div className="font-['Cinzel'] font-bold text-sm text-amber-200 flex items-center gap-1.5">
                <span>{myPlayer?.name || 'You'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
              </div>
              <div className="text-[10px] text-slate-400">
                Room: {publicState.sessionId}
              </div>
            </div>
          </div>

          {/* Prestige Points Progress Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 shadow">
            <Crown size={14} className="text-amber-400" />
            <span className="font-['Cinzel'] font-black text-amber-200 text-sm">
              {myPlayer?.prestigePoints || 0}
            </span>
            <span className="text-[10px] text-amber-400/70">/ {publicState.targetVP} VP</span>
          </div>
        </div>

        {/* View Mode Toggle: [My Hand & Actions] ↔ [Shared Table View] */}
        <div className="max-w-md mx-auto mt-2 grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-1.5 px-2 rounded-lg font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            <span>My Hand & Actions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`py-1.5 px-2 rounded-lg font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv size={14} />
            <span>Shared Board View</span>
          </button>
        </div>

        {/* Dynamic Turn Banner */}
        <div className="max-w-md mx-auto mt-2">
          {isMyTurn ? (
            <div className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-2 border-emerald-400 text-emerald-200 text-xs font-['Cinzel'] font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
              <Sparkles size={14} className="text-emerald-400" />
              <span>IT IS YOUR TURN! CHOOSE AN ACTION</span>
            </div>
          ) : (
            <div className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center font-['Cinzel'] flex items-center justify-center gap-1.5">
              <span>Waiting for {activePlayer?.name || 'opponent'} ({activePlayer?.avatar})</span>
            </div>
          )}
        </div>

        {/* Error message alert toast */}
        {errorMessage && (
          <div className="max-w-md mx-auto mt-2 p-2 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs flex items-center gap-1.5 animate-bounce">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </header>

      {/* Main Tab View Content */}
      <main className="max-w-md mx-auto w-full p-3 flex-1 flex flex-col gap-4">
        {activeTab === 'personal' ? (
          <>
            {/* Quick Turn Actions Accordion (when my turn) */}
            {isMyTurn && (
              <section className="p-3 rounded-2xl bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-900 border-2 border-amber-400 shadow-xl">
                <div className="font-['Cinzel'] font-black text-xs text-amber-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Available Turn Actions</span>
                </div>

                {/* 3 Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setActionMode(actionMode === 'take_gems' ? 'none' : 'take_gems')}
                    className={`py-2 px-1.5 rounded-xl font-['Cinzel'] font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      actionMode === 'take_gems'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Coins size={16} />
                    <span>Take Gems</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('table')}
                    className="py-2 px-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:border-amber-400 font-['Cinzel'] font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>Buy Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionMode(actionMode === 'reserve' ? 'none' : 'reserve')}
                    disabled={reservedCards.length >= 3}
                    className={`py-2 px-1.5 rounded-xl font-['Cinzel'] font-bold text-[11px] flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      actionMode === 'reserve'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300'
                        : reservedCards.length >= 3
                        ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <BookmarkPlus size={16} />
                    <span>Reserve Deck</span>
                  </button>
                </div>

                {/* Action drawer: Take Gems Interactive Drawer */}
                {actionMode === 'take_gems' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 animate-fade-in">
                    <div className="text-[11px] text-slate-300 mb-2 font-medium">
                      Select 3 different gems, or 2 identical gems (requires ≥4 in bank):
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {ALL_GEMS.map(gem => {
                        const bankCount = publicState.bank[gem] || 0;
                        const countStaged = stagedGems.filter(g => g === gem).length;
                        return (
                          <button
                            key={gem}
                            type="button"
                            disabled={bankCount === 0}
                            onClick={() => handleToggleGem(gem)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-transform cursor-pointer active:scale-95 ${
                              countStaged > 0
                                ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 scale-105'
                                : bankCount === 0
                                ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800'
                                : 'bg-slate-900 border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            <GemIcon type={gem} size="sm" variant="gem" />
                            <span className="text-[10px] text-slate-300 font-bold">{bankCount}</span>
                            {countStaged > 0 && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-full">
                                +{countStaged}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!gemValidation.valid}
                        onClick={handleConfirmTakeGems}
                        className={`flex-1 py-2 px-3 rounded-xl font-['Cinzel'] font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow transition-all ${
                          gemValidation.valid
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 ring-2 ring-emerald-300 cursor-pointer active:scale-95'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Confirm Take ({stagedGems.length} Gems)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStagedGems([]);
                          setActionMode('none');
                        }}
                        className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action drawer: Reserve Deck */}
                {actionMode === 'reserve' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 animate-fade-in">
                    <div className="text-[11px] text-slate-300 mb-2 font-medium">
                      Blind reserve from tier deck (+1 Gold coin wildcard):
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([3, 2, 1] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          disabled={publicState.decks[tier] === 0}
                          onClick={() => handleReserveDeck(tier)}
                          className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-amber-950 border border-slate-700 hover:border-amber-400 text-amber-200 font-['Cinzel'] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <span>Tier {tier} Deck</span>
                          <span className="text-[10px] text-amber-400">
                            {publicState.decks[tier]} cards
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* My Tokens Pouch */}
            <section className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel'] font-bold text-xs text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-400" />
                  <span>My Token Pouch</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  totalTokens > 10 ? 'bg-red-950 border-red-500 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  {totalTokens} / 10 max
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {ALL_TOKENS.map(token => {
                  const count = myPlayer?.tokens[token] || 0;
                  return (
                    <div
                      key={token}
                      className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center"
                    >
                      <GemIcon type={token} size="sm" variant={token === 'gold' ? 'token' : 'gem'} />
                      <span className="font-['Cinzel'] font-black text-xs text-amber-200 mt-1">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* My Permanent Engine Discounts */}
            <section className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel'] font-bold text-xs text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers size={14} className="text-amber-400" />
                  <span>Permanent Engine Discounts</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {myPlayer?.cards.length || 0} cards owned
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {ALL_GEMS.map(gem => (
                  <div
                    key={gem}
                    className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center"
                  >
                    <GemIcon type={gem} size="sm" variant="gem" />
                    <span className="font-['Cinzel'] font-black text-xs text-amber-300 mt-1">
                      +{bonuses[gem] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* My Secret Reserved Cards (Hand) */}
            <section className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Cinzel'] font-bold text-xs text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <BookmarkPlus size={14} className="text-amber-400" />
                  <span>My Reserved Cards (Private Hand)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {reservedCards.length} / 3 cards
                </span>
              </div>

              {reservedCards.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-['Cinzel']">
                  No cards reserved yet. Blind reserve from decks or market cards on your turn.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {reservedCards.map(card => {
                    const affordability = checkCardAffordability(
                      card,
                      myPlayer?.tokens || { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
                      bonuses
                    );

                    return (
                      <div key={card.id} className="relative flex flex-col items-center">
                        <DevelopmentCardView
                          card={card}
                          compact
                          isReservedCard
                          affordability={affordability}
                          isSelected={false}
                          disabled={!isMyTurn}
                        />
                        {isMyTurn && affordability.canAfford && (
                          <button
                            type="button"
                            onClick={() => handleBuyCard(card.id, true)}
                            className="mt-1 w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
                          >
                            <ShoppingBag size={12} />
                            <span>BUY NOW</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          /* Secondary View: Full Shared Board on Phone */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-['Cinzel'] font-bold text-sm text-amber-200">
                Shared Table Market
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="text-xs font-['Cinzel'] text-amber-400 underline cursor-pointer"
              >
                ← Back to My Hand
              </button>
            </div>

            {/* 3 Tiers of Market Cards */}
            {([3, 2, 1] as const).map(tier => (
              <div key={tier} className="flex flex-col gap-1.5">
                <div className="font-['Cinzel'] font-bold text-xs text-amber-300">
                  Tier {tier} Market ({publicState.decks[tier]} cards in deck)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {publicState.faceUpCards[tier]?.map(card => {
                    const affordability = checkCardAffordability(
                      card,
                      myPlayer?.tokens || { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
                      bonuses
                    );
                    const isSelected = selectedCardId === card.id;

                    return (
                      <div key={card.id} className="relative flex justify-center">
                        <DevelopmentCardView
                          card={card}
                          affordability={affordability}
                          isSelected={isSelected}
                          onSelect={() => isMyTurn && setSelectedCardId(isSelected ? null : card.id)}
                          onBuy={() => isMyTurn && handleBuyCard(card.id, false)}
                          onReserve={() => isMyTurn && handleReserveCard(card.id)}
                          disabled={!isMyTurn}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Discard Tokens Modal if over 10 tokens */}
      {publicState.pendingTokenDiscard && publicState.pendingTokenDiscard.playerIndex === myPlayerIndex && myPlayer && (
        <DiscardTokensModal
          player={{
            ...myPlayer,
            reservedCards: reservedCards,
            isAI: false,
          }}
          countToDiscard={publicState.pendingTokenDiscard.countToDiscard}
          onConfirmDiscard={tokens => {
            onSendAction({ type: 'discard_tokens', tokens });
          }}
        />
      )}
    </div>
  );
};
