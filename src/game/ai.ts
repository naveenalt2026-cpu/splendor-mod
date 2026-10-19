import { DevelopmentCard, GameState, GemCount, GemType, NobleTile, Player, TokenCount } from '../types/game.ts';
import { ALL_GEMS, ALL_TOKENS } from './constants.ts';
import {
  calculateBonuses,
  canTakeTokens,
  checkCardAffordability,
  checkNobleEligibility,
  executeBuyCard,
  executeDiscardTokens,
  executeReserveCard,
  executeTakeTokens,
} from './rules.ts';

export interface AIDecision {
  action: 'buy_card' | 'take_tokens' | 'reserve_card' | 'discard_tokens' | 'pass';
  cardId?: string;
  fromReserved?: boolean;
  gems?: GemType[];
  tier?: 1 | 2 | 3;
  discardTokens?: Partial<TokenCount>;
  reason: string;
}

export function chooseAIMove(state: GameState, playerIndex: number): AIDecision {
  const player = state.players[playerIndex];
  const difficulty = player.difficulty || 'medium';
  const bonuses = calculateBonuses(player.cards);

  // 1. Handle pending discard first if required
  if (state.pendingTokenDiscard && state.pendingTokenDiscard.playerIndex === playerIndex) {
    const countToDiscard = state.pendingTokenDiscard.countToDiscard;
    const discardPlan: Partial<TokenCount> = {};
    let remaining = countToDiscard;

    // Discard tokens with highest surplus or least needed
    const tokenOrder: (keyof TokenCount)[] = ['onyx', 'diamond', 'emerald', 'sapphire', 'ruby', 'gold'];
    for (const t of tokenOrder) {
      if (remaining <= 0) break;
      const count = player.tokens[t] || 0;
      if (count > 0) {
        const drop = Math.min(count, remaining);
        discardPlan[t] = drop;
        remaining -= drop;
      }
    }

    return {
      action: 'discard_tokens',
      discardTokens: discardPlan,
      reason: `Discarding ${countToDiscard} excess tokens.`,
    };
  }

  // 2. Identify all visible cards
  const allFaceUp: DevelopmentCard[] = [
    ...state.faceUpCards[3],
    ...state.faceUpCards[2],
    ...state.faceUpCards[1],
  ];

  // Evaluate card scoring heuristic based on difficulty
  const scoreCard = (card: DevelopmentCard): number => {
    let score = card.prestigePoints * 10;

    // Bonus value for nobles
    for (const noble of state.nobles) {
      const needed = noble.requirements[card.gemBonus] || 0;
      const current = bonuses[card.gemBonus] || 0;
      if (needed > current) {
        score += 6; // High incentive to acquire gems towards noble visits
      }
    }

    // Cost efficiency penalty
    const totalCost = Object.values(card.cost).reduce((sum, n) => sum + (n || 0), 0);
    score -= totalCost * 0.5;

    if (difficulty === 'hard') {
      // In hard mode, prioritize tier 3 and tier 2 cards heavily
      score += card.tier * 2;
    }

    return score;
  };

  // Check affordable cards (both from reserved hand and face up board)
  const affordableReserved = player.reservedCards
    .map(card => ({ card, fromReserved: true, affordability: checkCardAffordability(card, player.tokens, bonuses) }))
    .filter(item => item.affordability.canAfford);

  const affordableFaceUp = allFaceUp
    .map(card => ({ card, fromReserved: false, affordability: checkCardAffordability(card, player.tokens, bonuses) }))
    .filter(item => item.affordability.canAfford);

  const allAffordable = [...affordableReserved, ...affordableFaceUp];

  if (allAffordable.length > 0) {
    // Sort by best heuristic score
    allAffordable.sort((a, b) => scoreCard(b.card) - scoreCard(a.card));
    const bestChoice = allAffordable[0];

    return {
      action: 'buy_card',
      cardId: bestChoice.card.id,
      fromReserved: bestChoice.fromReserved,
      reason: `Purchasing ${bestChoice.card.name} for ${bestChoice.card.prestigePoints} VP and ${bestChoice.card.gemBonus} bonus.`,
    };
  }

  // 3. If cannot afford, choose an aspirational target card
  const aspirationalCards = [...player.reservedCards, ...allFaceUp].sort((a, b) => scoreCard(b) - scoreCard(a));
  const targetCard = aspirationalCards[0] || allFaceUp[0];

  // If hard difficulty and AI has space to reserve, check if user is close to a huge card or target is worth reserving
  if (difficulty !== 'easy' && player.reservedCards.length < 3 && state.bank.gold > 0 && targetCard) {
    if (targetCard.prestigePoints >= 3 && Math.random() < (difficulty === 'hard' ? 0.35 : 0.2)) {
      return {
        action: 'reserve_card',
        cardId: targetCard.id,
        reason: `Reserving valuable ${targetCard.name} (+${targetCard.prestigePoints} VP) to secure 1 Gold Joker.`,
      };
    }
  }

  // 4. Try taking 2 of the same gem color if bank >= 4 and AI needs this gem
  if (targetCard) {
    for (const gem of ALL_GEMS) {
      const required = targetCard.cost[gem] || 0;
      const current = (player.tokens[gem] || 0) + (bonuses[gem] || 0);
      if (required > current && (state.bank[gem] || 0) >= 4) {
        const canTake2 = canTakeTokens([gem, gem], state.bank);
        if (canTake2.valid) {
          return {
            action: 'take_tokens',
            gems: [gem, gem],
            reason: `Taking 2 ${gem} tokens for ${targetCard.name}.`,
          };
        }
      }
    }
  }

  // 5. Take 3 distinct gems
  // Determine desired gem colors ordered by demand
  const gemDemand: Record<GemType, number> = { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 };

  for (const card of aspirationalCards.slice(0, 3)) {
    for (const gem of ALL_GEMS) {
      const need = (card.cost[gem] || 0) - (player.tokens[gem] || 0) - (bonuses[gem] || 0);
      if (need > 0) gemDemand[gem] += need;
    }
  }

  // Also factor in noble patrons
  for (const noble of state.nobles) {
    for (const [gem, count] of Object.entries(noble.requirements) as [GemType, number][]) {
      const need = count - (bonuses[gem] || 0);
      if (need > 0) gemDemand[gem] += need;
    }
  }

  // Filter available gems in bank
  const availableInBank = ALL_GEMS.filter(gem => (state.bank[gem] || 0) > 0);
  availableInBank.sort((a, b) => gemDemand[b] - gemDemand[a]);

  const targetCount = Math.min(3, availableInBank.length);
  const selectedDistinct = availableInBank.slice(0, targetCount);

  if (selectedDistinct.length > 0) {
    const validation = canTakeTokens(selectedDistinct, state.bank);
    if (validation.valid) {
      return {
        action: 'take_tokens',
        gems: selectedDistinct,
        reason: `Collecting ${selectedDistinct.join(', ')} tokens to build up engine.`,
      };
    }
  }

  // 6. Fallback: reserve a card if possible
  if (player.reservedCards.length < 3 && allFaceUp.length > 0) {
    return {
      action: 'reserve_card',
      cardId: allFaceUp[0].id,
      reason: `Reserving ${allFaceUp[0].name}.`,
    };
  }

  // Final fallback: pass
  return {
    action: 'pass',
    reason: 'No viable action available this turn.',
  };
}

export function executeAIMove(state: GameState, playerIndex: number): GameState {
  const decision = chooseAIMove(state, playerIndex);

  switch (decision.action) {
    case 'buy_card':
      if (decision.cardId) {
        const res = executeBuyCard(state, playerIndex, decision.cardId, decision.fromReserved);
        return res.nextState;
      }
      break;

    case 'take_tokens':
      if (decision.gems && decision.gems.length > 0) {
        const res = executeTakeTokens(state, playerIndex, decision.gems);
        return res.nextState;
      }
      break;

    case 'reserve_card':
      if (decision.cardId || decision.tier) {
        const res = executeReserveCard(state, playerIndex, decision.cardId, decision.tier);
        return res.nextState;
      }
      break;

    case 'discard_tokens':
      if (decision.discardTokens) {
        const res = executeDiscardTokens(state, playerIndex, decision.discardTokens);
        return res.nextState;
      }
      break;

    case 'pass':
    default:
      break;
  }

  // If action could not be carried out, advance to next player cleanly
  const nextPlayer = (playerIndex + 1) % state.players.length;
  return {
    ...state,
    activePlayerIndex: nextPlayer,
  };
}
