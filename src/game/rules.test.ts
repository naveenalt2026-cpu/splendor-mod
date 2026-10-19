import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTakeTokens,
  checkCardAffordability,
  checkNobleEligibility,
  calculateBonuses,
  executeTakeTokens,
  executeBuyCard,
  executeReserveCard,
  createInitialGameState,
} from './rules.ts';
import { DevelopmentCard, NobleTile, TokenCount } from '../types/game.ts';

test('canTakeTokens validates 3 distinct gems and 2 of same color', () => {
  const bank: TokenCount = { ruby: 4, sapphire: 4, emerald: 4, diamond: 4, onyx: 4, gold: 5 };

  // Valid 3 distinct
  const res1 = canTakeTokens(['ruby', 'sapphire', 'emerald'], bank);
  assert.equal(res1.valid, true);

  // Valid 2 of same when count >= 4
  const res2 = canTakeTokens(['ruby', 'ruby'], bank);
  assert.equal(res2.valid, true);

  // Invalid 2 of same when count < 4
  const bankLowRuby: TokenCount = { ...bank, ruby: 3 };
  const res3 = canTakeTokens(['ruby', 'ruby'], bankLowRuby);
  assert.equal(res3.valid, false);

  // Invalid 4 gems
  const res4 = canTakeTokens(['ruby', 'sapphire', 'emerald', 'diamond'], bank);
  assert.equal(res4.valid, false);
});

test('checkCardAffordability accounts for permanent bonuses and gold wildcards', () => {
  const sampleCard: DevelopmentCard = {
    id: 'test_card_1',
    tier: 1,
    gemBonus: 'ruby',
    prestigePoints: 2,
    cost: { sapphire: 3, emerald: 2 },
    name: 'Test Workshop',
    illustration: '💎',
  };

  // Case 1: Player has 1 sapphire token, 2 emerald tokens, and 2 sapphire bonus -> sapphire cost (3 - 2 = 1) covered by token!
  const playerTokens: TokenCount = { ruby: 0, sapphire: 1, emerald: 2, diamond: 0, onyx: 0, gold: 0 };
  const playerBonuses = { ruby: 0, sapphire: 2, emerald: 0, diamond: 0, onyx: 0 };

  const aff1 = checkCardAffordability(sampleCard, playerTokens, playerBonuses);
  assert.equal(aff1.canAfford, true);
  assert.equal(aff1.goldNeeded, 0);

  // Case 2: Player has 0 sapphire tokens, 0 sapphire bonus, 2 emerald tokens, but 3 gold wildcards -> can afford with 3 gold!
  const playerWithGold: TokenCount = { ruby: 0, sapphire: 0, emerald: 2, diamond: 0, onyx: 0, gold: 3 };
  const aff2 = checkCardAffordability(sampleCard, playerWithGold, { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 });
  assert.equal(aff2.canAfford, true);
  assert.equal(aff2.goldNeeded, 3);

  // Case 3: Player lacks both tokens and gold
  const poorPlayer: TokenCount = { ruby: 0, sapphire: 0, emerald: 1, diamond: 0, onyx: 0, gold: 1 };
  const aff3 = checkCardAffordability(sampleCard, poorPlayer, { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0 });
  assert.equal(aff3.canAfford, false);
  assert.equal(aff3.missingGemsCount, 3);
});

test('checkNobleEligibility verifies patron bonus requirements', () => {
  const noble: NobleTile = {
    id: 'noble_test',
    name: 'Duke of Ferrara',
    prestigePoints: 3,
    requirements: { ruby: 4, diamond: 4 },
    avatar: '👑',
  };

  assert.equal(
    checkNobleEligibility({ ruby: 4, diamond: 4, sapphire: 0, emerald: 0, onyx: 0 }, noble),
    true
  );

  assert.equal(
    checkNobleEligibility({ ruby: 3, diamond: 4, sapphire: 1, emerald: 0, onyx: 0 }, noble),
    false
  );
});

test('executeTakeTokens updates player inventory and bank and passes turn', () => {
  const state = createInitialGameState({ playerCount: 2 });
  const initialRubyBank = state.bank.ruby;

  const { nextState, error } = executeTakeTokens(state, 0, ['ruby', 'sapphire', 'emerald']);
  assert.equal(error, undefined);
  assert.equal(nextState.players[0].tokens.ruby, 1);
  assert.equal(nextState.bank.ruby, initialRubyBank - 1);
  // Turn should have advanced to player 1 (the AI)
  assert.equal(nextState.activePlayerIndex, 1);
});

test('executeReserveCard grants gold token and puts card in reserved hand', () => {
  const state = createInitialGameState({ playerCount: 2 });
  const targetCard = state.faceUpCards[1][0];

  const { nextState, error } = executeReserveCard(state, 0, targetCard.id);
  assert.equal(error, undefined);
  assert.equal(nextState.players[0].reservedCards.length, 1);
  assert.equal(nextState.players[0].reservedCards[0].id, targetCard.id);
  assert.equal(nextState.players[0].tokens.gold, 1);
  assert.equal(nextState.bank.gold, 4);
});

test('AI generates valid legal actions and progresses state', async () => {
  const { chooseAIMove, executeAIMove } = await import('./ai.ts');
  const state = createInitialGameState({ playerCount: 2 });
  // Set active player to AI (player 1)
  const aiTurnState = { ...state, activePlayerIndex: 1 };
  const decision = chooseAIMove(aiTurnState, 1);
  assert.ok(['take_tokens', 'buy_card', 'reserve_card', 'pass'].includes(decision.action));

  const afterAIState = executeAIMove(aiTurnState, 1);
  // Turn should have advanced back to Player 0
  assert.equal(afterAIState.activePlayerIndex, 0);
});

