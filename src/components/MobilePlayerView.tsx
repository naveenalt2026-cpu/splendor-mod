import React, { useState } from 'react';
import { ClientGameAction, PrivatePlayerState, PublicGameState } from '../types/multiplayer.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { calculateBonuses, canTakeTokens, checkCardAffordability } from '../game/rules.ts';
import { DevelopmentCard, GemType, TokenType } from '../types/game.ts';
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
  ArrowLeft,
  ChevronRight,
  Info,
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
  // Navigation tabs: 'personal' (My Hand) vs 'table' (Board)
  const [activeTab, setActiveTab] = useState<'personal' | 'table'>('personal');
  // Staged action mode
  const [actionMode, setActionMode] = useState<'none' | 'take_gems' | 'reserve'>('none');
  // Staged gems for token collection
  const [stagedGems, setStagedGems] = useState<GemType[]>([]);
  // Detail sheet card selection
  const [inspectingCard, setInspectingCard] = useState<DevelopmentCard | null>(null);

  const myPlayer = publicState.players[myPlayerIndex] || publicState.players.find(p => p.id === myPlayerId);
  const isMyTurn = publicState.activePlayerIndex === myPlayerIndex && publicState.status !== 'game_over';
  const activePlayer = publicState.players[publicState.activePlayerIndex];

  const bonuses = myPlayer ? calculateBonuses(myPlayer.cards) : { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 };
  const totalTokens = myPlayer ? Object.values(myPlayer.tokens).reduce((acc, c) => acc + c, 0) : 0;
  const reservedCards = privateState?.reservedCards || [];

  // Toggle staged gem for collection
  const handleToggleGem = (gem: GemType) => {
    sound.playTokenPickup();
    setStagedGems(prev => {
      if (prev.includes(gem)) {
        if (prev.filter(g => g === gem).length === 1 && prev.length === 1) {
          // Double up on same gem (valid if bank has >= 4)
          return [gem, gem];
        }
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
    setInspectingCard(null);
    setActionMode('none');
  };

  // Submit reserve card
  const handleReserveCard = (cardId: string) => {
    sound.playTokenPickup();
    onSendAction({ type: 'reserve_card', cardId });
    setInspectingCard(null);
    setActionMode('none');
  };

  // Submit blind deck reserve
  const handleReserveDeck = (tier: 1 | 2 | 3) => {
    sound.playTokenPickup();
    onSendAction({ type: 'reserve_deck', tier });
    setActionMode('none');
  };

  const gemValidation = canTakeTokens(stagedGems, publicState.bank);

  // Calculate affordability for inspected card
  const inspectedAffordability = inspectingCard && myPlayer
    ? checkCardAffordability(inspectingCard, myPlayer.tokens, bonuses)
    : null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col justify-between select-none relative overflow-x-hidden font-sans pb-20">
      {/* Top Header: Player Profile & Room Info */}
      <header className="sticky top-0 z-40 bg-[#121826]/95 border-b border-white/8 px-4 py-3 backdrop-blur-md shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Player avatar & name */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl filter drop-shadow">{myPlayer?.avatar || '👑'}</span>
            <div>
              <div className="font-['Cinzel'] font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{myPlayer?.name || 'You'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Room: <span className="text-amber-300 font-bold">{publicState.sessionId}</span>
              </div>
            </div>
          </div>

          {/* VP Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-sm">
            <Crown size={14} className="text-amber-400" />
            <span className="font-['Cinzel'] font-black text-amber-300 text-sm">
              {myPlayer?.prestigePoints || 0}
            </span>
            <span className="text-[10px] text-amber-400/70 font-medium">/ {publicState.targetVP} VP</span>
          </div>
        </div>

        {/* Two Clear Top Tabs: [My Hand] | [Board] */}
        <div className="max-w-md mx-auto mt-3 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0B0F1A] border border-white/8">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-3 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={15} />
            <span>My Hand</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`py-2 px-3 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv size={15} />
            <span>Board</span>
          </button>
        </div>

        {/* Turn Status Banner */}
        <div className="max-w-md mx-auto mt-2.5">
          {isMyTurn ? (
            <div className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-['Cinzel'] font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Your Turn – Choose an Action</span>
            </div>
          ) : (
            <div className="py-2 px-3 rounded-2xl bg-[#0B0F1A]/80 border border-white/5 text-slate-400 text-xs text-center font-['Cinzel'] flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Waiting for {activePlayer?.name || 'opponent'} ({activePlayer?.avatar})</span>
            </div>
          )}
        </div>

        {/* Error message toast */}
        {errorMessage && (
          <div className="max-w-md mx-auto mt-2 p-2.5 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-bounce">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </header>

      {/* Main Tab Content */}
      <main className="max-w-md mx-auto w-full p-4 flex-1 flex flex-col gap-4">
        {activeTab === 'personal' ? (
          <>
            {/* Primary Action Buttons (Take Gems • Buy Card • Reserve) */}
            {isMyTurn && (
              <section className="p-3.5 rounded-2xl bg-[#121826] border border-amber-500/30 shadow-lg">
                <div className="text-[11px] font-['Cinzel'] font-bold text-amber-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Your Turn Actions</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Action 1: Take Gems */}
                  <button
                    type="button"
                    onClick={() => setActionMode(actionMode === 'take_gems' ? 'none' : 'take_gems')}
                    className={`py-2.5 px-2 rounded-xl font-['Cinzel'] font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      actionMode === 'take_gems'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 shadow-md'
                        : 'bg-[#0B0F1A] border-white/10 text-slate-200 hover:border-amber-400/50'
                    }`}
                  >
                    <Coins size={18} />
                    <span>Take Gems</span>
                  </button>

                  {/* Action 2: Buy Card (switches to board) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('table')}
                    className="py-2.5 px-2 rounded-xl bg-[#0B0F1A] border border-white/10 text-slate-200 hover:border-amber-400/50 font-['Cinzel'] font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShoppingBag size={18} />
                    <span>Buy Card</span>
                  </button>

                  {/* Action 3: Reserve Card / Deck */}
                  <button
                    type="button"
                    onClick={() => setActionMode(actionMode === 'reserve' ? 'none' : 'reserve')}
                    disabled={reservedCards.length >= 3}
                    className={`py-2.5 px-2 rounded-xl font-['Cinzel'] font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      actionMode === 'reserve'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 shadow-md'
                        : reservedCards.length >= 3
                        ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                        : 'bg-[#0B0F1A] border-white/10 text-slate-200 hover:border-amber-400/50'
                    }`}
                  >
                    <BookmarkPlus size={18} />
                    <span>Reserve</span>
                  </button>
                </div>

                {/* Drawer: Take Gems Interactive Selector */}
                {actionMode === 'take_gems' && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#0B0F1A] border border-amber-500/30 animate-fade-in">
                    <div className="text-[11px] text-slate-300 mb-2.5 font-medium">
                      Select 3 different gems or 2 identical gems (requires ≥4 in bank):
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {ALL_GEMS.map(gem => {
                        const bankCount = publicState.bank[gem] || 0;
                        const countStaged = stagedGems.filter(g => g === gem).length;
                        const isStaged = countStaged > 0;

                        return (
                          <button
                            key={gem}
                            type="button"
                            onClick={() => handleToggleGem(gem)}
                            disabled={bankCount === 0 && countStaged === 0}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all relative ${
                              isStaged
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400'
                                : 'bg-[#121826] border-white/10 hover:border-white/20'
                            } ${bankCount === 0 && countStaged === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                          >
                            <GemIcon type={gem} size="md" variant="gem" />
                            <span className="text-[10px] font-mono text-slate-400 mt-1">
                              ({bankCount})
                            </span>
                            {countStaged > 0 && (
                              <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                {countStaged}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmTakeGems}
                      disabled={!gemValidation.valid}
                      className={`w-full py-2 px-3 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        gemValidation.valid
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95'
                          : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Check size={14} />
                      <span>Confirm Collection ({stagedGems.length} gems)</span>
                    </button>
                  </div>
                )}

                {/* Drawer: Reserve Deck Options */}
                {actionMode === 'reserve' && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#0B0F1A] border border-amber-500/30 animate-fade-in">
                    <div className="text-[11px] text-slate-300 mb-2.5 font-medium">
                      Blind reserve top card from a tier deck (+1 Gold token):
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([3, 2, 1] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleReserveDeck(tier)}
                          disabled={publicState.decks[tier] === 0}
                          className="py-2 px-1 rounded-xl bg-[#121826] border border-white/10 hover:border-amber-400/50 text-slate-200 font-['Cinzel'] font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>Tier {tier}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {publicState.decks[tier]} cards
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* “My Tokens” Section: Large Tappable Gem Circles with Numbers Inside */}
            <section className="p-4 rounded-2xl bg-[#121826] border border-white/8 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="font-['Cinzel'] font-bold text-xs text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-400" />
                  <span>My Tokens</span>
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  totalTokens > 8 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
                }`}>
                  {totalTokens} / 10 Max
                </span>
              </div>

              {/* 6 Large Gem Circles (5 Gems + Gold) */}
              <div className="grid grid-cols-6 gap-2">
                {ALL_TOKENS.map(token => {
                  const count = myPlayer?.tokens[token] || 0;
                  return (
                    <div
                      key={token}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#0B0F1A] border border-white/5 shadow-xs"
                    >
                      <GemIcon type={token} size="md" variant={token === 'gold' ? 'chip' : 'gem'} />
                      <span className="font-mono font-black text-sm text-white mt-1.5">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Permanent Discounts shown as small elegant +X badges directly underneath */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-['Cinzel'] font-bold flex items-center gap-1">
                  <Layers size={13} className="text-amber-400" />
                  <span>Permanent Discounts:</span>
                </span>
                <div className="flex items-center gap-2">
                  {ALL_GEMS.map(gem => (
                    <div
                      key={gem}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#0B0F1A] border border-white/10"
                      title={`${gem} bonus: +${bonuses[gem]}`}
                    >
                      <GemIcon type={gem} size="xs" variant="gem" />
                      <span className="font-mono font-bold text-[10px] text-amber-300">
                        +{bonuses[gem] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* “Reserved Cards” Area (Private Hand) */}
            <section className="p-4 rounded-2xl bg-[#121826] border border-white/8 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="font-['Cinzel'] font-bold text-xs text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                  <BookmarkPlus size={14} className="text-amber-400" />
                  <span>Reserved Cards (Hand)</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {reservedCards.length} / 3
                </span>
              </div>

              {reservedCards.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-500 font-['Cinzel'] flex flex-col items-center gap-1.5">
                  <span>No reserved cards yet.</span>
                  <span className="text-[10px] text-slate-600 font-sans">
                    Reserve cards on the Board to hold them and collect +1 gold wildcard.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            className="mt-2 w-full py-1.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95"
                          >
                            <ShoppingBag size={13} />
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
          /* ========================================================= */
          /* Board Tab (Mobile): Nobles Carousel + 3 Tiers of Cards     */
          /* ========================================================= */
          <div className="flex flex-col gap-4">
            {/* Nobles Horizontal Carousel at Top */}
            {publicState.nobles.length > 0 && (
              <section className="p-3.5 rounded-2xl bg-[#121826] border border-white/8 shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-['Cinzel'] font-bold text-xs text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-400" />
                    <span>Noble Patrons ({publicState.nobles.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">+3 VP on bonus match</span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 items-stretch">
                  {publicState.nobles.map(noble => (
                    <NobleTileView
                      key={noble.id}
                      noble={noble}
                      playerBonuses={bonuses}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3 Tiers of Market Cards (Tier 3 -> Tier 2 -> Tier 1) */}
            {([3, 2, 1] as const).map(tier => {
              const cards = publicState.faceUpCards[tier] || [];
              const deckCount = publicState.decks[tier] || 0;

              return (
                <section key={tier} className="p-3.5 rounded-2xl bg-[#121826] border border-white/8 shadow-md">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-['Cinzel'] font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-amber-300 font-mono text-[10px]">
                        T{tier}
                      </span>
                      <span>Tier {tier} Market</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Deck: {deckCount} cards
                    </span>
                  </div>

                  {/* Horizontal scrollable row for each tier */}
                  <div className="flex gap-2.5 overflow-x-auto pb-1 items-center">
                    {cards.map(card => {
                      const affordability = checkCardAffordability(
                        card,
                        myPlayer?.tokens || { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
                        bonuses
                      );

                      return (
                        <div
                          key={card.id}
                          onClick={() => setInspectingCard(card)}
                          className="shrink-0 cursor-pointer"
                        >
                          <DevelopmentCardView
                            card={card}
                            compact
                            affordability={affordability}
                            isSelected={inspectingCard?.id === card.id}
                            disabled={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Floating "Back to My Hand" Button on Board Tab */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="py-2.5 px-5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-['Cinzel'] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-transform"
              >
                <ArrowLeft size={16} />
                <span>Back to My Hand</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Card Detail Sheet (Bottom Sheet / Modal when tapping card on Board) */}
      {inspectingCard && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0F1A]/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setInspectingCard(null)}
        >
          <div
            className="w-full max-w-md bg-[#121826] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow">{inspectingCard.illustration}</span>
                <div>
                  <h3 className="font-['Cinzel'] font-bold text-base text-slate-100">
                    {inspectingCard.name}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Tier {inspectingCard.tier}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">+{inspectingCard.prestigePoints} Prestige Points</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingCard(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Permanent Discount Provided */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0F1A] border border-white/5">
              <span className="text-xs text-slate-300 font-medium">Permanent Engine Discount:</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <GemIcon type={inspectingCard.gemBonus} size="xs" variant="gem" />
                <span className="font-['Cinzel'] font-bold text-xs text-slate-100 capitalize">
                  +1 {inspectingCard.gemBonus}
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-['Cinzel'] font-bold text-amber-200">
                Purchase Cost:
              </span>

              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(inspectingCard.cost) as [GemType, number][]).map(([gem, cost]) => {
                  if (!cost || cost <= 0) return null;
                  const discount = bonuses[gem] || 0;
                  const playerTokens = myPlayer?.tokens[gem] || 0;
                  const effectiveCost = Math.max(0, cost - discount);
                  const isCovered = discount >= cost;

                  return (
                    <div
                      key={gem}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                        isCovered
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                          : effectiveCost <= playerTokens
                          ? 'bg-[#0B0F1A] border-white/10 text-slate-200'
                          : 'bg-[#0B0F1A] border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <GemIcon type={gem} size="xs" variant="gem" />
                        <span className="font-bold">{cost}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Disc: +{discount} | You: {playerTokens})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: BUY / RESERVE */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleBuyCard(inspectingCard.id, false)}
                disabled={!isMyTurn || !inspectedAffordability?.canAfford}
                className={`flex-1 py-3 px-4 rounded-xl font-['Cinzel'] font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  isMyTurn && inspectedAffordability?.canAfford
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95'
                    : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <ShoppingBag size={16} />
                <span>Buy Card</span>
                {inspectedAffordability && inspectedAffordability.goldNeeded > 0 && (
                  <span className="text-xs text-amber-900 font-sans">({inspectedAffordability.goldNeeded} gold)</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleReserveCard(inspectingCard.id)}
                disabled={!isMyTurn || reservedCards.length >= 3}
                className={`py-3 px-4 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isMyTurn && reservedCards.length < 3
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer active:scale-95'
                    : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                }`}
              >
                <BookmarkPlus size={16} />
                <span>Reserve (+1 Gold)</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
