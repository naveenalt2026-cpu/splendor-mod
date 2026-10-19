import React, { useState } from 'react';
import { CardAffordability, DevelopmentCard, GameState, GemCount, GemType, Player, TokenType } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS, GEM_COLORS, TOKEN_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { DevelopmentCardView } from './DevelopmentCardView.tsx';
import { calculateBonuses, checkCardAffordability } from '../game/rules.ts';
import { History, Shield, Sparkles, BookOpen, Crown, Check, X } from 'lucide-react';

interface BottomPlayerTableauProps {
  player: Player;
  isMyTurn: boolean;
  onBuyCard: (cardId: string, fromReserved: boolean) => void;
  onReserveDeck: (tier: 1 | 2 | 3) => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  deckCounts: { 1: number; 2: number; 3: number };
}

export const BottomPlayerTableau: React.FC<BottomPlayerTableauProps> = ({
  player,
  isMyTurn,
  onBuyCard,
  onReserveDeck,
  onOpenHistory,
  onOpenRules,
  deckCounts,
}) => {
  const [selectedReservedCardId, setSelectedReservedCardId] = useState<string | null>(null);
  const [showDeckReserveMenu, setShowDeckReserveMenu] = useState(false);
  const [confirmingMenuTier, setConfirmingMenuTier] = useState<1 | 2 | 3 | null>(null);

  const bonuses = calculateBonuses(player.cards);
  const totalTokens = Object.values(player.tokens).reduce((acc, c) => acc + c, 0);

  // Group purchased cards by gem bonus for the permanent discount display
  const cardsByGem: Record<GemType, DevelopmentCard[]> = {
    ruby: [],
    sapphire: [],
    emerald: [],
    diamond: [],
    onyx: [],
  };

  for (const card of player.cards) {
    cardsByGem[card.gemBonus].push(card);
  }

  return (
    <footer className="relative w-full z-20 px-3 py-2 bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-950/80 border-t border-amber-500/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Player's Permanent Gem Engine (Bonuses) */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full pb-1 md:pb-0">
          <div className="hidden sm:flex flex-col items-center justify-center pr-2 border-r border-slate-800">
            <span className="font-['Cinzel'] font-bold text-amber-200 text-xs uppercase">Engine</span>
            <span className="text-[10px] text-slate-400">{player.cards.length} cards</span>
          </div>

          {ALL_GEMS.map(gem => {
            const count = bonuses[gem] || 0;
            const color = GEM_COLORS[gem];
            const cardsInGem = cardsByGem[gem];

            return (
              <div
                key={gem}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                  count > 0
                    ? 'border-amber-400/60 bg-slate-900/90 shadow-md'
                    : 'border-slate-800 bg-slate-950/50 opacity-60'
                }`}
                title={`${color.name} engine: permanent discount of ${count} gem(s)`}
              >
                <GemIcon type={gem} size="sm" variant="gem" />
                <div className="flex flex-col">
                  <span className="font-['Cinzel'] font-bold text-xs text-amber-200">
                    +{count}
                  </span>
                  <span className="text-[9px] text-slate-400 capitalize hidden sm:inline">
                    {color.name}
                  </span>
                </div>

                {/* Overlapping mini card stack indicator if multiple */}
                {count > 1 && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded-full">
                    x{count}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Center: Player's Token Pouch (Ruby, Sapphire, Emerald, Diamond, Onyx, Gold) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/70 border border-slate-800 shadow-inner">
          <div className="flex flex-col items-end pr-2 border-r border-slate-800">
            <span className="font-['Cinzel'] font-bold text-amber-300 text-xs">Tokens</span>
            <span className={`text-[10px] ${totalTokens >= 10 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
              {totalTokens}/10
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ALL_TOKENS.map(token => {
              const count = player.tokens[token] || 0;
              return (
                <div
                  key={token}
                  className="flex flex-col items-center gap-0.5"
                  title={`${TOKEN_COLORS[token].name}: ${count} in hand`}
                >
                  <GemIcon
                    type={token}
                    size="sm"
                    variant={token === 'gold' ? 'chip' : 'disc'}
                  />
                  <span className="text-xs font-bold text-slate-200">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claimed Noble Patrons Display Shelf (Always visible in tableau) */}
        <div
          id="player-claimed-nobles"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-all ${
            player.nobles.length > 0
              ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.45)] ring-1 ring-amber-400/50'
              : 'bg-black/50 border-slate-800/80 opacity-80'
          }`}
          title={
            player.nobles.length > 0
              ? `${player.nobles.length} Noble Patron(s) claimed: +${player.nobles.length * 3} VP`
              : 'No Noble Patrons claimed yet (worth 3 VP each)'
          }
        >
          <div className="flex flex-col items-center pr-1.5 border-r border-slate-700/60">
            <span className="font-['Cinzel'] font-black text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-0.5">
              <Crown size={12} className="text-amber-400" />
              Patrons
            </span>
            <span className="text-[10px] text-amber-200 font-bold">
              +{player.nobles.length * 3} VP
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-w-[32px]">
            {player.nobles.length === 0 ? (
              <span className="text-[10px] text-slate-500 font-['Cinzel'] px-1">0 / 3</span>
            ) : (
              player.nobles.map(n => (
                <div
                  key={n.id}
                  className="relative group w-8 h-8 rounded-lg bg-slate-900 border-2 border-amber-300 flex items-center justify-center text-base shadow hover:scale-115 transition-transform cursor-pointer"
                  title={`${n.name}: awards 3 VP`}
                >
                  <span>{n.avatar}</span>
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full shadow">
                    3
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Reserved Cards Drawer & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reserved cards trigger & count */}
          <div className="relative flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {player.reservedCards.length === 0 ? (
                <div className="px-3 py-2 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 font-['Cinzel']">
                  No Reserved Cards (0/3)
                </div>
              ) : (
                player.reservedCards.map(card => {
                  const affordability = checkCardAffordability(card, player.tokens, bonuses);
                  const isSelected = selectedReservedCardId === card.id;

                  return (
                    <div key={card.id} className={`relative ${isSelected ? 'z-30' : 'z-10'}`}>
                      <DevelopmentCardView
                        card={card}
                        compact
                        isReservedCard
                        affordability={affordability}
                        isSelected={isSelected}
                        onSelect={() =>
                          setSelectedReservedCardId(isSelected ? null : card.id)
                        }
                        onBuy={() => {
                          onBuyCard(card.id, true);
                          setSelectedReservedCardId(null);
                        }}
                        disabled={!isMyTurn}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action buttons: Blind Deck Reserve, History, Rules */}
          <div className="flex items-center gap-1.5">
            {/* Blind Deck Reserve button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDeckReserveMenu(!showDeckReserveMenu)}
                disabled={!isMyTurn || player.reservedCards.length >= 3}
                className={`px-2.5 py-1.5 rounded-xl font-['Cinzel'] font-bold text-xs flex items-center gap-1 border transition-all ${
                  isMyTurn && player.reservedCards.length < 3
                    ? 'bg-slate-900 border-amber-500/60 text-amber-200 hover:bg-slate-800 cursor-pointer shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Reserve blindly from top of tier decks (+1 Gold)"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Reserve Deck</span>
              </button>

              {/* Tier deck selection dropdown */}
              {showDeckReserveMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-52 p-2 rounded-xl bg-slate-950 border border-amber-500/60 shadow-2xl flex flex-col gap-1.5 z-50">
                  <div className="text-[11px] font-['Cinzel'] font-bold text-amber-200 text-center pb-1 border-b border-slate-800">
                    Blind Deck Reserve (+1 Gold)
                  </div>
                  {([3, 2, 1] as const).map(tier => (
                    confirmingMenuTier === tier ? (
                      <div
                        key={tier}
                        className="w-full py-1 px-1.5 rounded bg-amber-950/80 border border-amber-400 flex items-center justify-between gap-1 text-xs animate-fade-in"
                      >
                        <span className="font-['Cinzel'] font-bold text-amber-200 text-[10px]">
                          T{tier}? (+1🪙)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onReserveDeck(tier);
                              setConfirmingMenuTier(null);
                              setShowDeckReserveMenu(false);
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-['Cinzel'] font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <Check size={11} />
                            <span>YES</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingMenuTier(null)}
                            className="px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        key={tier}
                        type="button"
                        disabled={deckCounts[tier] === 0}
                        onClick={() => setConfirmingMenuTier(tier)}
                        className="w-full py-1 px-2 rounded bg-slate-900 hover:bg-amber-950 text-slate-200 hover:text-amber-200 text-xs font-semibold flex items-center justify-between border border-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <span>Tier {tier} Deck</span>
                        <span className="text-[10px] text-amber-400">({deckCounts[tier]} left)</span>
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* History Log trigger */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors shadow"
              title="Game Log & Move History"
              aria-label="View Game Move History"
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
