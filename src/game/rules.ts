import { CardAffordability, DevelopmentCard, GameState, GemCount, GemType, NobleTile, Player, TokenCount, TokenType } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS, INITIAL_BANK_BY_PLAYERS, NOBLES_COUNT_BY_PLAYERS, NOBLE_TILES, TIER_1_CARDS, TIER_2_CARDS, TIER_3_CARDS } from './constants.ts';

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function calculateBonuses(cards: DevelopmentCard[]): GemCount {
  const bonuses: GemCount = { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 };
  for (const card of cards) {
    bonuses[card.gemBonus] = (bonuses[card.gemBonus] || 0) + 1;
  }
  return bonuses;
}

export function getTotalTokensCount(tokens: TokenCount): number {
  return Object.values(tokens).reduce((acc, count) => acc + count, 0);
}

export function checkCardAffordability(
  card: DevelopmentCard,
  playerTokens: TokenCount,
  playerBonuses: GemCount
): CardAffordability {
  const tokensUsed: Partial<Record<GemType, number>> = {};
  let goldNeeded = 0;
  let totalMissing = 0;

  for (const gem of ALL_GEMS) {
    const required = card.cost[gem] || 0;
    const bonus = playerBonuses[gem] || 0;
    const effectiveCost = Math.max(0, required - bonus);

    const availableTokens = playerTokens[gem] || 0;
    const fromTokens = Math.min(availableTokens, effectiveCost);
    tokensUsed[gem] = fromTokens;

    const deficit = effectiveCost - fromTokens;
    if (deficit > 0) {
      goldNeeded += deficit;
      totalMissing += deficit;
    }
  }

  const availableGold = playerTokens.gold || 0;
  const canAfford = availableGold >= goldNeeded;

  return {
    canAfford,
    requiredGems: card.cost,
    bonuses: playerBonuses,
    tokensUsed,
    goldNeeded,
    missingGemsCount: Math.max(0, totalMissing - availableGold),
  };
}

export function canTakeTokens(
  selectedGems: GemType[],
  bank: TokenCount
): { valid: boolean; reason?: string } {
  if (selectedGems.length === 0) {
    return { valid: false, reason: 'Select tokens to collect.' };
  }

  // Case 1: Taking 2 of the same color
  if (selectedGems.length === 2 && selectedGems[0] === selectedGems[1]) {
    const gem = selectedGems[0];
    if ((bank[gem] || 0) < 4) {
      return {
        valid: false,
        reason: `Cannot take 2 ${gem} tokens unless bank has at least 4 available (currently ${bank[gem] || 0}).`,
      };
    }
    return { valid: true };
  }

  // Case 2: Taking distinct tokens (up to 3)
  const uniqueGems = new Set(selectedGems);
  if (uniqueGems.size !== selectedGems.length) {
    return {
      valid: false,
      reason: 'When taking multiple tokens, they must either be 3 different gems or 2 of the same color.',
    };
  }

  if (selectedGems.length > 3) {
    return { valid: false, reason: 'Cannot take more than 3 tokens per turn.' };
  }

  // Check if bank has enough for each
  for (const gem of selectedGems) {
    if ((bank[gem] || 0) <= 0) {
      return { valid: false, reason: `No ${gem} tokens left in the bank.` };
    }
  }

  // In official rules, if fewer than 3 gem types exist in the bank, player may take fewer (e.g. 1 or 2 distinct)
  const availableGemTypes = ALL_GEMS.filter(g => (bank[g] || 0) > 0);
  const maxDistinctPossible = Math.min(3, availableGemTypes.length);

  if (selectedGems.length < maxDistinctPossible) {
    return {
      valid: false,
      reason: `You must select ${maxDistinctPossible} different tokens if available in the bank.`,
    };
  }

  return { valid: true };
}

export function checkNobleEligibility(bonuses: GemCount, noble: NobleTile): boolean {
  for (const [gem, count] of Object.entries(noble.requirements) as [GemType, number][]) {
    if ((bonuses[gem] || 0) < count) {
      return false;
    }
  }
  return true;
}

export function createInitialGameState(config: {
  playerCount: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}): GameState {
  const playerCount = Math.max(2, Math.min(4, config.playerCount));
  const aiDifficulty = config.aiDifficulty || 'medium';

  // Shuffle decks
  const shuffledTier1 = shuffle(TIER_1_CARDS);
  const shuffledTier2 = shuffle(TIER_2_CARDS);
  const shuffledTier3 = shuffle(TIER_3_CARDS);
  const shuffledNobles = shuffle(NOBLE_TILES).slice(0, NOBLES_COUNT_BY_PLAYERS[playerCount]);

  // Deal 4 face-up cards per tier
  const faceUpCards = {
    1: shuffledTier1.splice(0, 4),
    2: shuffledTier2.splice(0, 4),
    3: shuffledTier3.splice(0, 4),
  };

  const initialBank: TokenCount = { ...INITIAL_BANK_BY_PLAYERS[playerCount] };

  // Create players
  const players: Player[] = [
    {
      id: 'player_1',
      name: 'Player 1',
      isAI: false,
      avatar: '👑',
      tokens: { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
      cards: [],
      reservedCards: [],
      nobles: [],
      prestigePoints: 0,
    },
  ];

  const aiNames = [
    { name: 'AI Tactician', avatar: '🧙‍♂️', difficulty: aiDifficulty },
    { name: 'AI Grandmaster', avatar: '🧝‍♂️', difficulty: 'hard' as const },
    { name: 'AI Merchant', avatar: '🧔', difficulty: 'easy' as const },
  ];

  for (let i = 1; i < playerCount; i++) {
    const aiConfig = aiNames[i - 1];
    players.push({
      id: `ai_${i}`,
      name: aiConfig.name,
      isAI: true,
      difficulty: aiConfig.difficulty,
      avatar: aiConfig.avatar,
      tokens: { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
      cards: [],
      reservedCards: [],
      nobles: [],
      prestigePoints: 0,
    });
  }

  return {
    players,
    activePlayerIndex: 0,
    bank: initialBank,
    decks: {
      1: shuffledTier1,
      2: shuffledTier2,
      3: shuffledTier3,
    },
    faceUpCards,
    nobles: shuffledNobles,
    status: 'playing',
    winnerId: null,
    log: [
      {
        id: 'log_0',
        turn: 1,
        playerId: 'system',
        playerName: 'Game Engine',
        action: 'pass',
        description: `Splendor match commenced! First to 15 Prestige Points triggers final round.`,
        timestamp: Date.now(),
      },
    ],
    turnCount: 1,
    targetVP: 15,
    finalRoundTriggeredByPlayerIndex: null,
    pendingTokenDiscard: null,
  };
}

export function executeTakeTokens(
  state: GameState,
  playerIndex: number,
  gems: GemType[]
): { nextState: GameState; error?: string } {
  const validation = canTakeTokens(gems, state.bank);
  if (!validation.valid) {
    return { nextState: state, error: validation.reason };
  }

  const newBank = { ...state.bank };
  const player = state.players[playerIndex];
  const newPlayerTokens = { ...player.tokens };

  for (const gem of gems) {
    newBank[gem] -= 1;
    newPlayerTokens[gem] += 1;
  }

  const updatedPlayer = {
    ...player,
    tokens: newPlayerTokens,
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  const gemSummary = gems.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ');
  const logEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: state.turnCount,
    playerId: player.id,
    playerName: player.name,
    action: 'take_tokens' as const,
    description: `${player.name} collected tokens: ${gemSummary}.`,
    timestamp: Date.now(),
  };

  const nextState: GameState = {
    ...state,
    bank: newBank,
    players: updatedPlayers,
    log: [logEntry, ...state.log],
  };

  // Check if player has more than 10 tokens
  const totalTokens = getTotalTokensCount(newPlayerTokens);
  if (totalTokens > 10) {
    return {
      nextState: {
        ...nextState,
        pendingTokenDiscard: {
          playerIndex,
          countToDiscard: totalTokens - 10,
        },
      },
    };
  }

  return { nextState: finalizeTurn(nextState) };
}

export function executeBuyCard(
  state: GameState,
  playerIndex: number,
  cardId: string,
  fromReserved = false
): { nextState: GameState; error?: string } {
  const player = state.players[playerIndex];
  const playerBonuses = calculateBonuses(player.cards);

  let targetCard: DevelopmentCard | undefined;
  let cardTier: 1 | 2 | 3 = 1;

  if (fromReserved) {
    targetCard = player.reservedCards.find(c => c.id === cardId);
    if (!targetCard) return { nextState: state, error: 'Reserved card not found.' };
    cardTier = targetCard.tier;
  } else {
    for (const tier of [1, 2, 3] as const) {
      const found = state.faceUpCards[tier].find(c => c.id === cardId);
      if (found) {
        targetCard = found;
        cardTier = tier;
        break;
      }
    }
  }

  if (!targetCard) {
    return { nextState: state, error: 'Card not available to purchase.' };
  }

  const affordability = checkCardAffordability(targetCard, player.tokens, playerBonuses);
  if (!affordability.canAfford) {
    return { nextState: state, error: 'Insufficient tokens to purchase this card.' };
  }

  // Deduct tokens from player and return to bank
  const newBank = { ...state.bank };
  const newPlayerTokens = { ...player.tokens };

  for (const gem of ALL_GEMS) {
    const tokensSpent = affordability.tokensUsed[gem] || 0;
    newPlayerTokens[gem] -= tokensSpent;
    newBank[gem] += tokensSpent;
  }

  if (affordability.goldNeeded > 0) {
    newPlayerTokens.gold -= affordability.goldNeeded;
    newBank.gold += affordability.goldNeeded;
  }

  // Update cards list
  const newCards = [...player.cards, targetCard];
  let newReservedCards = player.reservedCards;
  if (fromReserved) {
    newReservedCards = player.reservedCards.filter(c => c.id !== targetCard!.id);
  }

  const updatedPlayer: Player = {
    ...player,
    tokens: newPlayerTokens,
    cards: newCards,
    reservedCards: newReservedCards,
    prestigePoints: player.prestigePoints + targetCard.prestigePoints,
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  // Refill face up cards if purchased from market
  const newFaceUpCards = { ...state.faceUpCards };
  const newDecks = { ...state.decks };

  if (!fromReserved) {
    const tierDeck = [...newDecks[cardTier]];
    const newCard = tierDeck.pop();
    newDecks[cardTier] = tierDeck;

    newFaceUpCards[cardTier] = state.faceUpCards[cardTier].map(c =>
      c.id === targetCard!.id ? (newCard ? newCard : null) : c
    ).filter(Boolean) as DevelopmentCard[];
  }

  const logEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: state.turnCount,
    playerId: player.id,
    playerName: player.name,
    action: 'buy_card' as const,
    description: `${player.name} bought ${targetCard.name} (+${targetCard.prestigePoints} VP, ${targetCard.gemBonus.toUpperCase()} bonus).`,
    timestamp: Date.now(),
  };

  let nextState: GameState = {
    ...state,
    bank: newBank,
    players: updatedPlayers,
    decks: newDecks,
    faceUpCards: newFaceUpCards,
    log: [logEntry, ...state.log],
  };

  // Check noble visits
  nextState = checkNobleVisits(nextState, playerIndex);

  return { nextState: finalizeTurn(nextState) };
}

export function executeReserveCard(
  state: GameState,
  playerIndex: number,
  cardId?: string,
  tier?: 1 | 2 | 3
): { nextState: GameState; error?: string } {
  const player = state.players[playerIndex];
  if (player.reservedCards.length >= 3) {
    return { nextState: state, error: 'Cannot reserve more than 3 cards at a time.' };
  }

  let reservedCard: DevelopmentCard | undefined;
  let targetTier: 1 | 2 | 3 = tier || 1;
  const newFaceUpCards = { ...state.faceUpCards };
  const newDecks = { ...state.decks };

  if (cardId) {
    for (const t of [1, 2, 3] as const) {
      const found = state.faceUpCards[t].find(c => c.id === cardId);
      if (found) {
        reservedCard = found;
        targetTier = t;
        break;
      }
    }

    if (!reservedCard) {
      return { nextState: state, error: 'Target card not found.' };
    }

    // Refill face-up market
    const deck = [...newDecks[targetTier]];
    const nextDrawn = deck.pop();
    newDecks[targetTier] = deck;

    newFaceUpCards[targetTier] = state.faceUpCards[targetTier].map(c =>
      c.id === reservedCard!.id ? (nextDrawn ? nextDrawn : null) : c
    ).filter(Boolean) as DevelopmentCard[];
  } else if (tier) {
    // Blind reserve from top of tier deck
    const deck = [...newDecks[tier]];
    if (deck.length === 0) {
      return { nextState: state, error: `Tier ${tier} deck is empty.` };
    }
    reservedCard = deck.pop()!;
    newDecks[tier] = deck;
  }

  if (!reservedCard) {
    return { nextState: state, error: 'No card selected to reserve.' };
  }

  // Grant 1 gold token if bank has gold
  const newBank = { ...state.bank };
  const newPlayerTokens = { ...player.tokens };
  let goldAwarded = false;

  if (newBank.gold > 0) {
    newBank.gold -= 1;
    newPlayerTokens.gold += 1;
    goldAwarded = true;
  }

  const updatedPlayer: Player = {
    ...player,
    tokens: newPlayerTokens,
    reservedCards: [...player.reservedCards, reservedCard],
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  const logEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: state.turnCount,
    playerId: player.id,
    playerName: player.name,
    action: 'reserve_card' as const,
    description: `${player.name} reserved ${cardId ? reservedCard.name : `Tier ${targetTier} card`}${goldAwarded ? ' and gained 1 Gold Joker' : ''}.`,
    timestamp: Date.now(),
  };

  const nextState: GameState = {
    ...state,
    bank: newBank,
    players: updatedPlayers,
    decks: newDecks,
    faceUpCards: newFaceUpCards,
    log: [logEntry, ...state.log],
  };

  // Check 10-token limit
  const totalTokens = getTotalTokensCount(newPlayerTokens);
  if (totalTokens > 10) {
    return {
      nextState: {
        ...nextState,
        pendingTokenDiscard: {
          playerIndex,
          countToDiscard: totalTokens - 10,
        },
      },
    };
  }

  return { nextState: finalizeTurn(nextState) };
}

export function executeDiscardTokens(
  state: GameState,
  playerIndex: number,
  tokensToDiscard: Partial<TokenCount>
): { nextState: GameState; error?: string } {
  if (!state.pendingTokenDiscard || state.pendingTokenDiscard.playerIndex !== playerIndex) {
    return { nextState: state, error: 'No discard action pending for this player.' };
  }

  const requiredCount = state.pendingTokenDiscard.countToDiscard;
  const discardedCount = Object.values(tokensToDiscard).reduce((sum, val) => sum + (val || 0), 0);

  if (discardedCount !== requiredCount) {
    return {
      nextState: state,
      error: `Must discard exactly ${requiredCount} tokens (selected ${discardedCount}).`,
    };
  }

  const player = state.players[playerIndex];
  const newPlayerTokens = { ...player.tokens };
  const newBank = { ...state.bank };

  for (const token of ALL_TOKENS) {
    const toDrop = tokensToDiscard[token] || 0;
    if (toDrop > newPlayerTokens[token]) {
      return { nextState: state, error: `Cannot discard more ${token} than you hold.` };
    }
    newPlayerTokens[token] -= toDrop;
    newBank[token] += toDrop;
  }

  const updatedPlayer = {
    ...player,
    tokens: newPlayerTokens,
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  const logEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: state.turnCount,
    playerId: player.id,
    playerName: player.name,
    action: 'discard_tokens' as const,
    description: `${player.name} returned ${discardedCount} excess tokens to the bank.`,
    timestamp: Date.now(),
  };

  const nextState: GameState = {
    ...state,
    bank: newBank,
    players: updatedPlayers,
    pendingTokenDiscard: null,
    log: [logEntry, ...state.log],
  };

  return { nextState: finalizeTurn(nextState) };
}

export function checkNobleVisits(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  const bonuses = calculateBonuses(player.cards);

  const eligibleNobles = state.nobles.filter(n => checkNobleEligibility(bonuses, n));
  if (eligibleNobles.length === 0) {
    return state;
  }

  // Under official Splendor rules, exactly ONE noble visits per turn
  const visitingNoble = eligibleNobles[0];
  const remainingNobles = state.nobles.filter(n => n.id !== visitingNoble.id);

  const updatedPlayer: Player = {
    ...player,
    nobles: [...player.nobles, visitingNoble],
    prestigePoints: player.prestigePoints + visitingNoble.prestigePoints,
  };

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  const logEntry = {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: state.turnCount,
    playerId: player.id,
    playerName: player.name,
    action: 'noble_visit' as const,
    description: `Noble Patron ${visitingNoble.name} awarded ${player.name} ${visitingNoble.prestigePoints} Prestige Points!`,
    timestamp: Date.now(),
  };

  return {
    ...state,
    nobles: remainingNobles,
    players: updatedPlayers,
    log: [logEntry, ...state.log],
  };
}

export function finalizeTurn(state: GameState): GameState {
  // If a player reached 15+ VP and final round hasn't triggered yet
  let currentFinalRoundTrigger = state.finalRoundTriggeredByPlayerIndex;
  const activePlayer = state.players[state.activePlayerIndex];

  if (activePlayer.prestigePoints >= state.targetVP && currentFinalRoundTrigger === null) {
    currentFinalRoundTrigger = state.activePlayerIndex;
  }

  // Advance turn
  const nextPlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  const isFullRoundComplete = nextPlayerIndex === 0;

  // If final round was triggered and we completed the round (back to player 0)
  if (currentFinalRoundTrigger !== null && isFullRoundComplete) {
    // Determine winner: highest prestige points; tie-breaker: fewest purchased development cards
    let winningPlayer = state.players[0];
    for (let i = 1; i < state.players.length; i++) {
      const p = state.players[i];
      if (p.prestigePoints > winningPlayer.prestigePoints) {
        winningPlayer = p;
      } else if (p.prestigePoints === winningPlayer.prestigePoints) {
        if (p.cards.length < winningPlayer.cards.length) {
          winningPlayer = p;
        }
      }
    }

    const logEntry = {
      id: `log_${Date.now()}_win`,
      turn: state.turnCount,
      playerId: winningPlayer.id,
      playerName: winningPlayer.name,
      action: 'pass' as const,
      description: `🏆 ${winningPlayer.name} is victorious with ${winningPlayer.prestigePoints} Prestige Points!`,
      timestamp: Date.now(),
    };

    return {
      ...state,
      status: 'game_over',
      winnerId: winningPlayer.id,
      finalRoundTriggeredByPlayerIndex: currentFinalRoundTrigger,
      log: [logEntry, ...state.log],
    };
  }

  return {
    ...state,
    activePlayerIndex: nextPlayerIndex,
    turnCount: isFullRoundComplete ? state.turnCount + 1 : state.turnCount,
    status: currentFinalRoundTrigger !== null ? 'final_round' : 'playing',
    finalRoundTriggeredByPlayerIndex: currentFinalRoundTrigger,
  };
}
