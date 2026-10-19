import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from './sessionManager.ts';
import { WebSocket } from 'ws';

test('SessionManager creates unique sessions in lobby state', () => {
  const sm = new SessionManager();
  const mockWs = {} as WebSocket;
  const session = sm.createSession(mockWs, 15);

  assert.ok(session.sessionId);
  assert.equal(session.status, 'lobby');
  assert.equal(session.players.length, 0);
  assert.equal(session.targetVP, 15);
});

test('SessionManager adds players up to 4 and prevents exceeding capacity', () => {
  const sm = new SessionManager();
  const mockWs = {} as WebSocket;
  const session = sm.createSession(mockWs);

  const p1 = sm.addPlayer(session.sessionId, 'Lorenzo', '👑', mockWs);
  assert.ok(!('error' in p1));
  assert.equal(p1.player.name, 'Lorenzo');
  assert.equal(p1.player.playerIndex, 0);

  const p2 = sm.addPlayer(session.sessionId, 'Caterina', '👸', mockWs);
  assert.ok(!('error' in p2));
  assert.equal(p2.player.playerIndex, 1);

  const p3 = sm.addPlayer(session.sessionId, 'Leonardo', '🎨', mockWs);
  assert.ok(!('error' in p3));
  assert.equal(p3.player.playerIndex, 2);

  const p4 = sm.addPlayer(session.sessionId, 'Michelangelo', '🔨', mockWs);
  assert.ok(!('error' in p4));
  assert.equal(p4.player.playerIndex, 3);

  // 5th player should be rejected
  const p5 = sm.addPlayer(session.sessionId, 'Raphael', '✨', mockWs);
  assert.ok('error' in p5);
});

test('SessionManager starts game authoritatively with 2 players', () => {
  const sm = new SessionManager();
  const mockWs = {} as WebSocket;
  const session = sm.createSession(mockWs);

  sm.addPlayer(session.sessionId, 'Player 1', '👑', mockWs);
  sm.addPlayer(session.sessionId, 'Player 2', '👸', mockWs);

  const startRes = sm.startGame(session.sessionId);
  assert.ok(startRes.success);
  assert.equal(session.status, 'playing');

  const publicState = sm.getPublicState(session.sessionId);
  assert.ok(publicState);
  assert.equal(publicState.players.length, 2);
  // In 2-player Splendor: 4 of each gem token, 5 gold tokens, 3 nobles
  assert.equal(publicState.bank.ruby, 4);
  assert.equal(publicState.bank.gold, 5);
  assert.equal(publicState.nobles.length, 3);
  assert.equal(publicState.faceUpCards[1].length, 4);
});

test('SessionManager validates turns and legal actions authoritatively', () => {
  const sm = new SessionManager();
  const mockWs = {} as WebSocket;
  const session = sm.createSession(mockWs);

  const p1 = sm.addPlayer(session.sessionId, 'Player 1', '👑', mockWs) as any;
  const p2 = sm.addPlayer(session.sessionId, 'Player 2', '👸', mockWs) as any;
  sm.startGame(session.sessionId);

  // Player 2 attempts to act out of turn
  const outOfTurn = sm.handlePlayerAction(session.sessionId, p2.player.id, {
    type: 'take_tokens',
    gems: ['ruby', 'sapphire', 'emerald'],
  });
  assert.equal(outOfTurn.success, false);
  assert.ok(outOfTurn.error?.includes("Player 1's turn"));

  // Player 1 executes valid token collection (3 distinct gems)
  const validAction = sm.handlePlayerAction(session.sessionId, p1.player.id, {
    type: 'take_tokens',
    gems: ['ruby', 'sapphire', 'emerald'],
  });
  assert.equal(validAction.success, true);

  const publicState = sm.getPublicState(session.sessionId);
  assert.ok(publicState);
  // Bank updated
  assert.equal(publicState.bank.ruby, 3);
  assert.equal(publicState.bank.sapphire, 3);
  assert.equal(publicState.bank.emerald, 3);
  // Player 1 tokens updated
  assert.equal(publicState.players[0].tokens.ruby, 1);
  assert.equal(publicState.players[0].tokens.sapphire, 1);
  assert.equal(publicState.players[0].tokens.emerald, 1);
  // Turn passed to Player 2
  assert.equal(publicState.activePlayerIndex, 1);
});

test('SessionManager isolates private reserved cards from public state', () => {
  const sm = new SessionManager();
  const mockWs = {} as WebSocket;
  const session = sm.createSession(mockWs);

  const p1 = sm.addPlayer(session.sessionId, 'Player 1', '👑', mockWs) as any;
  const p2 = sm.addPlayer(session.sessionId, 'Player 2', '👸', mockWs) as any;
  sm.startGame(session.sessionId);

  // Player 1 blind reserves Tier 1 card
  const reserveAction = sm.handlePlayerAction(session.sessionId, p1.player.id, {
    type: 'reserve_deck',
    tier: 1,
  });
  assert.equal(reserveAction.success, true);

  // Public state shows only count (1 reserved card), not the card content
  const publicState = sm.getPublicState(session.sessionId);
  assert.ok(publicState);
  assert.equal(publicState.players[0].reservedCardsCount, 1);
  assert.equal((publicState.players[0] as any).reservedCards, undefined);

  // Private state for Player 1 contains the actual card
  const privateP1 = sm.getPrivateState(session.sessionId, p1.player.id);
  assert.ok(privateP1);
  assert.equal(privateP1.reservedCards.length, 1);
  assert.ok(privateP1.reservedCards[0].id);

  // Private state for Player 2 has 0 reserved cards
  const privateP2 = sm.getPrivateState(session.sessionId, p2.player.id);
  assert.ok(privateP2);
  assert.equal(privateP2.reservedCards.length, 0);
});

test('SessionManager handles lobby player disconnection grace period and reconnection', () => {
  const sm = new SessionManager();
  const mockWs1 = {} as WebSocket;
  const mockWs2 = {} as WebSocket;
  const session = sm.createSession(mockWs1);

  const p1 = sm.addPlayer(session.sessionId, 'Lorenzo', '👑', mockWs1) as any;
  assert.ok(p1.player);

  // Player disconnects (e.g. mobile screen locks in lobby)
  sm.removePlayer(session.sessionId, p1.player.id, false);
  const found = session.players.find(p => p.id === p1.player.id);
  assert.ok(found);
  assert.equal(found?.connected, false);

  // Player unlocks mobile screen and reconnects with playerId
  const reconnectRes = sm.addPlayer(session.sessionId, 'Lorenzo', '👑', mockWs2, p1.player.id) as any;
  assert.equal(reconnectRes.isReconnection, true);
  assert.equal(reconnectRes.player.id, p1.player.id);
  assert.equal(reconnectRes.player.connected, true);
});

test('SessionManager handles active game reconnection with full state restoration', () => {
  const sm = new SessionManager();
  const mockWs1 = {} as WebSocket;
  const mockWs2 = {} as WebSocket;
  const session = sm.createSession(mockWs1);

  const p1 = sm.addPlayer(session.sessionId, 'Player 1', '👑', mockWs1) as any;
  const p2 = sm.addPlayer(session.sessionId, 'Player 2', '👸', mockWs2) as any;
  sm.startGame(session.sessionId);

  // Player 1 collects gems
  sm.handlePlayerAction(session.sessionId, p1.player.id, {
    type: 'take_tokens',
    gems: ['ruby', 'sapphire', 'emerald'],
  });

  // Player 1 screen locks (socket disconnects)
  sm.removePlayer(session.sessionId, p1.player.id, false);
  assert.equal(session.players[0].connected, false);

  // Player 1 unlocks phone and reconnects
  const mockWsNew = {} as WebSocket;
  const reconnectRes = sm.addPlayer(session.sessionId, 'Player 1', '👑', mockWsNew, p1.player.id) as any;
  assert.equal(reconnectRes.isReconnection, true);
  assert.equal(session.players[0].connected, true);

  // Verify Player 1 still has their collected tokens
  const publicState = sm.getPublicState(session.sessionId);
  assert.ok(publicState);
  assert.equal(publicState.players[0].tokens.ruby, 1);
  assert.equal(publicState.players[0].tokens.sapphire, 1);
  assert.equal(publicState.players[0].tokens.emerald, 1);
});

