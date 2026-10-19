export type GemType = 'ruby' | 'sapphire' | 'emerald' | 'diamond' | 'onyx';
export type TokenType = GemType | 'gold';

export type GemCount = Record<GemType, number>;
export type TokenCount = Record<TokenType, number>;

export interface DevelopmentCard {
  id: string;
  tier: 1 | 2 | 3;
  gemBonus: GemType;
  prestigePoints: number;
  cost: Partial<Record<GemType, number>>;
  name: string;
  title?: string;
  illustration: string;
}

export interface NobleTile {
  id: string;
  name: string;
  prestigePoints: number;
  requirements: Partial<Record<GemType, number>>;
  avatar: string;
  flavorText?: string;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  avatar: string;
  tokens: TokenCount;
  cards: DevelopmentCard[];
  reservedCards: DevelopmentCard[];
  nobles: NobleTile[];
  prestigePoints: number;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  playerId: string;
  playerName: string;
  action: 'take_tokens' | 'buy_card' | 'reserve_card' | 'noble_visit' | 'discard_tokens' | 'pass';
  description: string;
  timestamp: number;
  details?: {
    card?: DevelopmentCard;
    noble?: NobleTile;
    tokens?: Partial<TokenCount>;
    cardId?: string;
    cardName?: string;
    cardTier?: 1 | 2 | 3;
    cardBonus?: GemType;
    cardIllustration?: string;
    nobleName?: string;
    prestigePointsGained?: number;
    goldAwarded?: boolean;
    discardedCount?: number;
    playerAvatar?: string;
  };
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  bank: TokenCount;
  decks: {
    1: DevelopmentCard[];
    2: DevelopmentCard[];
    3: DevelopmentCard[];
  };
  faceUpCards: {
    1: DevelopmentCard[];
    2: DevelopmentCard[];
    3: DevelopmentCard[];
  };
  nobles: NobleTile[];
  status: 'lobby' | 'setup' | 'playing' | 'final_round' | 'game_over';
  winnerId: string | null;
  log: GameLogEntry[];
  turnCount: number;
  targetVP: number;
  finalRoundTriggeredByPlayerIndex: number | null;
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

export interface CardAffordability {
  canAfford: boolean;
  requiredGems: Partial<Record<GemType, number>>;
  bonuses: Record<GemType, number>;
  tokensUsed: Partial<Record<GemType, number>>;
  goldNeeded: number;
  missingGemsCount: number;
}
