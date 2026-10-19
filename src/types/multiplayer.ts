import { DevelopmentCard, GameLogEntry, GameState, GemType, NobleTile, Player, TokenCount, TokenType } from './game.ts';

export interface SessionPlayer {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  connected: boolean;
  playerIndex: number;
}

export interface PublicPlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  connected: boolean;
  prestigePoints: number;
  tokens: TokenCount;
  cards: DevelopmentCard[];
  reservedCardsCount: number;
  nobles: NobleTile[];
}

export interface PublicGameState {
  sessionId: string;
  status: 'lobby' | 'setup' | 'playing' | 'final_round' | 'game_over';
  activePlayerIndex: number;
  turnCount: number;
  targetVP: number;
  bank: TokenCount;
  decks: {
    1: number;
    2: number;
    3: number;
  };
  faceUpCards: {
    1: DevelopmentCard[];
    2: DevelopmentCard[];
    3: DevelopmentCard[];
  };
  nobles: NobleTile[];
  players: PublicPlayerInfo[];
  log: GameLogEntry[];
  winnerId: string | null;
  pendingTokenDiscard: {
    playerIndex: number;
    countToDiscard: number;
  } | null;
  claimedNobleEvent?: {
    noble: NobleTile;
    playerIndex: number;
    playerName: string;
  } | null;
}

export interface PrivatePlayerState {
  playerId: string;
  reservedCards: DevelopmentCard[];
}

export type ClientGameAction =
  | { type: 'take_tokens'; gems: GemType[] }
  | { type: 'buy_card'; cardId: string; fromReserved: boolean }
  | { type: 'reserve_card'; cardId: string }
  | { type: 'reserve_deck'; tier: 1 | 2 | 3 }
  | { type: 'discard_tokens'; tokens: Partial<Record<TokenType, number>> };

export type ClientMessage =
  | { type: 'host_create_session'; targetVP?: number }
  | { type: 'host_reconnect'; sessionId: string }
  | { type: 'player_join_session'; sessionId: string; playerName: string; avatar: string; playerId?: string }
  | { type: 'player_leave_session'; sessionId: string; playerId: string }
  | { type: 'host_add_ai'; sessionId: string; difficulty?: 'easy' | 'medium' | 'hard' }
  | { type: 'host_start_game'; sessionId: string }
  | { type: 'host_restart_game'; sessionId: string }
  | { type: 'game_action'; sessionId: string; playerId: string; action: ClientGameAction }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'session_created'; sessionId: string; joinUrl: string }
  | { type: 'player_join_success'; sessionId: string; playerId: string; playerIndex: number; publicState: PublicGameState; privateState: PrivatePlayerState }
  | { type: 'session_lobby_update'; sessionId: string; players: SessionPlayer[]; canStart: boolean }
  | { type: 'game_state_sync'; publicState: PublicGameState; privateState?: PrivatePlayerState }
  | { type: 'action_error'; message: string }
  | { type: 'player_disconnected'; playerId: string; playerName: string }
  | { type: 'player_reconnected'; playerId: string; playerName: string }
  | { type: 'error'; message: string }
  | { type: 'pong' };
