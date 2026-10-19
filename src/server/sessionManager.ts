import { WebSocket } from 'ws';
import { DevelopmentCard, GameState, GemType, NobleTile, Player, TokenCount, TokenType } from '../types/game.ts';
import {
  ClientGameAction,
  PublicGameState,
  PublicPlayerInfo,
  PrivatePlayerState,
  SessionPlayer,
} from '../types/multiplayer.ts';
import {
  canTakeTokens,
  checkCardAffordability,
  checkNobleEligibility,
  checkNobleVisits,
  createInitialGameState,
  executeBuyCard,
  executeDiscardTokens,
  executeReserveCard,
  executeTakeTokens,
  finalizeTurn,
  getTotalTokensCount,
  shuffle,
} from '../game/rules.ts';
import { executeAIMove } from '../game/ai.ts';
import {
  INITIAL_BANK_BY_PLAYERS,
  NOBLES_COUNT_BY_PLAYERS,
  NOBLE_TILES,
  TIER_1_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
} from '../game/constants.ts';

export interface GameSession {
  sessionId: string;
  createdAt: number;
  hostWs: WebSocket | null;
  targetVP: number;
  players: {
    id: string;
    name: string;
    avatar: string;
    isAI: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    ws: WebSocket | null;
    connected: boolean;
  }[];
  state: GameState | null;
  status: 'lobby' | 'setup' | 'playing' | 'final_round' | 'game_over';
}

export class SessionManager {
  private sessions = new Map<string, GameSession>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  // Generate friendly 6-char room code (e.g., GEM-492)
  private generateRoomCode(): string {
    const prefixes = ['GEM', 'RUBY', 'GOLD', 'OPAL', 'ROYAL', 'CROWN'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${num}`;
    return this.sessions.has(code) ? this.generateRoomCode() : code;
  }

  public createSession(hostWs: WebSocket, targetVP = 15): GameSession {
    const sessionId = this.generateRoomCode();
    const session: GameSession = {
      sessionId,
      createdAt: Date.now(),
      hostWs,
      targetVP,
      players: [],
      state: null,
      status: 'lobby',
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId.toUpperCase());
  }

  public setHostSocket(sessionId: string, hostWs: WebSocket): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    session.hostWs = hostWs;
    return true;
  }

  public addPlayer(
    sessionId: string,
    playerName: string,
    avatar: string,
    ws: WebSocket,
    existingPlayerId?: string
  ): { player: SessionPlayer; isReconnection: boolean } | { error: string } {
    const session = this.getSession(sessionId);
    if (!session) return { error: 'Session not found.' };

    // Check reconnection
    if (existingPlayerId) {
      const existing = session.players.find(p => p.id === existingPlayerId);
      if (existing) {
        const timerKey = `${sessionId}:${existingPlayerId}`;
        const timer = this.disconnectTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(timerKey);
        }
        existing.ws = ws;
        existing.connected = true;
        const playerIndex = session.players.indexOf(existing);
        return {
          player: {
            id: existing.id,
            name: existing.name,
            avatar: existing.avatar,
            isAI: false,
            connected: true,
            playerIndex,
          },
          isReconnection: true,
        };
      }
    }

    // Fallback reconnection: check for disconnected human player with matching name
    const trimmedName = playerName.trim().toLowerCase();
    if (trimmedName) {
      const offlineMatch = session.players.find(
        p => !p.connected && !p.isAI && p.name.trim().toLowerCase() === trimmedName
      );
      if (offlineMatch) {
        const timerKey = `${sessionId}:${offlineMatch.id}`;
        const timer = this.disconnectTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(timerKey);
        }
        offlineMatch.ws = ws;
        offlineMatch.connected = true;
        if (avatar) offlineMatch.avatar = avatar;
        const playerIndex = session.players.indexOf(offlineMatch);
        return {
          player: {
            id: offlineMatch.id,
            name: offlineMatch.name,
            avatar: offlineMatch.avatar,
            isAI: false,
            connected: true,
            playerIndex,
          },
          isReconnection: true,
        };
      }
    }

    if (session.status !== 'lobby') {
      // Check if an AI slot is available to take over
      const aiPlayer = session.players.find(p => p.isAI);
      if (aiPlayer && session.state) {
        aiPlayer.name = playerName.trim() || 'Player';
        aiPlayer.avatar = avatar || '👑';
        aiPlayer.isAI = false;
        aiPlayer.ws = ws;
        aiPlayer.connected = true;
        const playerIndex = session.players.indexOf(aiPlayer);
        session.state.players[playerIndex].name = aiPlayer.name;
        session.state.players[playerIndex].avatar = aiPlayer.avatar;
        session.state.players[playerIndex].isAI = false;
        return {
          player: {
            id: aiPlayer.id,
            name: aiPlayer.name,
            avatar: aiPlayer.avatar,
            isAI: false,
            connected: true,
            playerIndex,
          },
          isReconnection: true,
        };
      }
      return { error: 'Game is already in progress and all slots are occupied.' };
    }

    if (session.players.length >= 4) {
      return { error: 'Session is full (maximum 4 players).' };
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newPlayer = {
      id: playerId,
      name: playerName.trim() || `Player ${session.players.length + 1}`,
      avatar: avatar || '👑',
      isAI: false,
      ws,
      connected: true,
    };

    session.players.push(newPlayer);
    const playerIndex = session.players.length - 1;

    return {
      player: {
        id: newPlayer.id,
        name: newPlayer.name,
        avatar: newPlayer.avatar,
        isAI: false,
        connected: true,
        playerIndex,
      },
      isReconnection: false,
    };
  }

  public addAI(
    sessionId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): { player: SessionPlayer } | { error: string } {
    const session = this.getSession(sessionId);
    if (!session) return { error: 'Session not found.' };
    if (session.status !== 'lobby') return { error: 'Game already in progress.' };
    if (session.players.length >= 4) return { error: 'Session is full.' };

    const aiAvatars = ['🧙‍♂️', '🧝‍♂️', '🧔', '👸'];
    const aiNames = ['AI Tactician', 'AI Merchant', 'AI Grandmaster', 'AI Baroness'];
    const idx = session.players.length;

    const aiPlayer = {
      id: `ai_${Date.now()}_${idx}`,
      name: aiNames[idx % aiNames.length],
      avatar: aiAvatars[idx % aiAvatars.length],
      isAI: true,
      difficulty,
      ws: null,
      connected: true,
    };

    session.players.push(aiPlayer);

    return {
      player: {
        id: aiPlayer.id,
        name: aiPlayer.name,
        avatar: aiPlayer.avatar,
        isAI: true,
        connected: true,
        playerIndex: idx,
      },
    };
  }

  public removePlayer(sessionId: string, playerId: string, explicit = false): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    const player = session.players.find(p => p.id === playerId);
    if (!player) return false;

    player.connected = false;
    player.ws = null;

    const timerKey = `${sessionId}:${playerId}`;
    const existingTimer = this.disconnectTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.disconnectTimers.delete(timerKey);
    }

    if (session.status === 'lobby') {
      if (explicit) {
        session.players = session.players.filter(p => p.id !== playerId);
      } else {
        // Disconnect grace period (90 seconds) for lobby disconnections
        const timer = setTimeout(() => {
          this.disconnectTimers.delete(timerKey);
          const s = this.getSession(sessionId);
          if (s && s.status === 'lobby') {
            const pl = s.players.find(p => p.id === playerId);
            if (pl && !pl.connected) {
              s.players = s.players.filter(p => p.id !== playerId);
              this.broadcastLobbyUpdate(sessionId);
            }
          }
        }, 90000);
        this.disconnectTimers.set(timerKey, timer);
      }
    }
    return true;
  }

  public startGame(sessionId: string): { success: boolean; error?: string } {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Session not found.' };
    if (session.players.length < 2) {
      return { success: false, error: 'At least 2 players are required to start Splendor.' };
    }

    const playerCount = session.players.length;
    const shuffledTier1 = shuffle(TIER_1_CARDS);
    const shuffledTier2 = shuffle(TIER_2_CARDS);
    const shuffledTier3 = shuffle(TIER_3_CARDS);
    const shuffledNobles = shuffle(NOBLE_TILES).slice(0, NOBLES_COUNT_BY_PLAYERS[playerCount]);

    const faceUpCards = {
      1: shuffledTier1.splice(0, 4),
      2: shuffledTier2.splice(0, 4),
      3: shuffledTier3.splice(0, 4),
    };

    const initialBank: TokenCount = { ...INITIAL_BANK_BY_PLAYERS[playerCount] };

    const gameStatePlayers: Player[] = session.players.map(p => ({
      id: p.id,
      name: p.name,
      isAI: p.isAI,
      difficulty: p.difficulty,
      avatar: p.avatar,
      tokens: { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
      cards: [],
      reservedCards: [],
      nobles: [],
      prestigePoints: 0,
    }));

    session.state = {
      players: gameStatePlayers,
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
          id: `log_init_${Date.now()}`,
          turn: 1,
          playerId: 'server',
          playerName: 'Table Host',
          action: 'pass',
          description: `Splendor multiplayer match begun with ${playerCount} players! Target: ${session.targetVP} Prestige Points.`,
          timestamp: Date.now(),
        },
      ],
      turnCount: 1,
      targetVP: session.targetVP,
      finalRoundTriggeredByPlayerIndex: null,
      pendingTokenDiscard: null,
      claimedNobleEvent: null,
    };

    session.status = 'playing';
    return { success: true };
  }

  public handlePlayerAction(
    sessionId: string,
    playerId: string,
    action: ClientGameAction
  ): { success: boolean; error?: string } {
    const session = this.getSession(sessionId);
    if (!session || !session.state) {
      return { success: false, error: 'Active game session not found.' };
    }

    const state = session.state;
    if (state.status === 'game_over') {
      return { success: false, error: 'The game has concluded.' };
    }

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.id !== playerId) {
      return { success: false, error: `It is currently ${activePlayer.name}'s turn.` };
    }

    let result: { nextState: GameState; error?: string };

    switch (action.type) {
      case 'take_tokens': {
        result = executeTakeTokens(state, state.activePlayerIndex, action.gems);
        break;
      }
      case 'buy_card': {
        result = executeBuyCard(state, state.activePlayerIndex, action.cardId, action.fromReserved);
        break;
      }
      case 'reserve_card': {
        result = executeReserveCard(state, state.activePlayerIndex, action.cardId);
        break;
      }
      case 'reserve_deck': {
        result = executeReserveCard(state, state.activePlayerIndex, undefined, action.tier);
        break;
      }
      case 'discard_tokens': {
        if (!state.pendingTokenDiscard || state.pendingTokenDiscard.playerIndex !== state.activePlayerIndex) {
          return { success: false, error: 'No tokens pending discard.' };
        }
        result = executeDiscardTokens(state, state.activePlayerIndex, action.tokens);
        break;
      }
      default:
        return { success: false, error: 'Unrecognized action.' };
    }

    if (result.error) {
      return { success: false, error: result.error };
    }

    session.state = result.nextState;
    session.status = result.nextState.status;

    // Handle any sequential AI moves if next player is AI
    this.runAITurnsIfNeeded(session);

    return { success: true };
  }

  private runAITurnsIfNeeded(session: GameSession): void {
    if (!session.state || session.state.status === 'game_over') return;

    let currentState = session.state;
    let nextPlayer = currentState.players[currentState.activePlayerIndex];

    while (nextPlayer && nextPlayer.isAI && currentState.status !== 'game_over') {
      currentState = executeAIMove(currentState, currentState.activePlayerIndex);
      session.state = currentState;
      session.status = currentState.status;
      nextPlayer = currentState.players[currentState.activePlayerIndex];
    }
  }

  public getPublicState(sessionId: string): PublicGameState | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    if (!session.state) {
      return {
        sessionId: session.sessionId,
        status: 'lobby',
        activePlayerIndex: 0,
        turnCount: 0,
        targetVP: session.targetVP,
        bank: { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
        decks: { 1: 0, 2: 0, 3: 0 },
        faceUpCards: { 1: [], 2: [], 3: [] },
        nobles: [],
        players: session.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isAI: p.isAI,
          connected: p.connected,
          prestigePoints: 0,
          tokens: { ruby: 0, sapphire: 0, emerald: 0, diamond: 0, onyx: 0, gold: 0 },
          cards: [],
          reservedCardsCount: 0,
          nobles: [],
        })),
        log: [],
        winnerId: null,
        pendingTokenDiscard: null,
        claimedNobleEvent: null,
      };
    }

    const state = session.state;
    const publicPlayers: PublicPlayerInfo[] = state.players.map(p => {
      const sessionPlayer = session.players.find(sp => sp.id === p.id);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isAI: p.isAI,
        connected: sessionPlayer ? sessionPlayer.connected : true,
        prestigePoints: p.prestigePoints,
        tokens: p.tokens,
        cards: p.cards,
        reservedCardsCount: p.reservedCards.length,
        nobles: p.nobles,
      };
    });

    return {
      sessionId: session.sessionId,
      status: state.status,
      activePlayerIndex: state.activePlayerIndex,
      turnCount: state.turnCount,
      targetVP: state.targetVP,
      bank: state.bank,
      decks: {
        1: state.decks[1].length,
        2: state.decks[2].length,
        3: state.decks[3].length,
      },
      faceUpCards: state.faceUpCards,
      nobles: state.nobles,
      players: publicPlayers,
      log: state.log,
      winnerId: state.winnerId,
      pendingTokenDiscard: state.pendingTokenDiscard,
      claimedNobleEvent: state.claimedNobleEvent || null,
    };
  }

  public getPrivateState(sessionId: string, playerId: string): PrivatePlayerState | null {
    const session = this.getSession(sessionId);
    if (!session || !session.state) return null;

    const player = session.state.players.find(p => p.id === playerId);
    if (!player) return null;

    return {
      playerId: player.id,
      reservedCards: player.reservedCards,
    };
  }

  public broadcastToSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const publicState = this.getPublicState(sessionId);
    if (!publicState) return;

    // 1. Broadcast to Host Table View
    if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
      session.hostWs.send(
        JSON.stringify({
          type: 'game_state_sync',
          publicState,
        })
      );
    }

    // 2. Broadcast to each Mobile Player (Public State + their own Private State)
    for (const p of session.players) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        const privateState = this.getPrivateState(sessionId, p.id);
        p.ws.send(
          JSON.stringify({
            type: 'game_state_sync',
            publicState,
            privateState: privateState || undefined,
          })
        );
      }
    }
  }

  public broadcastLobbyUpdate(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const sessionPlayers: SessionPlayer[] = session.players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isAI: p.isAI,
      connected: p.connected,
      playerIndex: idx,
    }));

    const message = JSON.stringify({
      type: 'session_lobby_update',
      sessionId: session.sessionId,
      players: sessionPlayers,
      canStart: session.players.length >= 2,
    });

    if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
      session.hostWs.send(message);
    }

    for (const p of session.players) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(message);
      }
    }
  }
}

export const sessionManager = new SessionManager();
