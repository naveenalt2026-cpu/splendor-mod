import { DevelopmentCard, GemType, NobleTile, TokenType } from '../types/game.ts';

export const GEM_COLORS: Record<GemType, {
  name: string;
  primary: string;
  secondary: string;
  border: string;
  glow: string;
  bgGradient: string;
  text: string;
  lightBg: string;
}> = {
  ruby: {
    name: 'Ruby',
    primary: '#ef4444',
    secondary: '#b91c1c',
    border: '#f87171',
    glow: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'from-red-600 via-rose-700 to-red-950',
    text: 'text-red-400',
    lightBg: 'bg-red-500/20',
  },
  sapphire: {
    name: 'Sapphire',
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    border: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.6)',
    bgGradient: 'from-blue-600 via-indigo-700 to-blue-950',
    text: 'text-blue-400',
    lightBg: 'bg-blue-500/20',
  },
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    secondary: '#047857',
    border: '#34d399',
    glow: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'from-emerald-600 via-teal-700 to-emerald-950',
    text: 'text-emerald-400',
    lightBg: 'bg-emerald-500/20',
  },
  diamond: {
    name: 'Diamond',
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    border: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.7)',
    bgGradient: 'from-slate-100 via-slate-300 to-slate-600',
    text: 'text-slate-100',
    lightBg: 'bg-white/20',
  },
  onyx: {
    name: 'Onyx',
    primary: '#334155',
    secondary: '#0f172a',
    border: '#64748b',
    glow: 'rgba(100, 116, 139, 0.6)',
    bgGradient: 'from-slate-700 via-slate-900 to-black',
    text: 'text-slate-300',
    lightBg: 'bg-slate-700/30',
  },
};

export const TOKEN_COLORS: Record<TokenType, {
  name: string;
  primary: string;
  secondary: string;
  border: string;
  glow: string;
  ring: string;
}> = {
  ruby: { ...GEM_COLORS.ruby, ring: 'border-red-400' },
  sapphire: { ...GEM_COLORS.sapphire, ring: 'border-blue-400' },
  emerald: { ...GEM_COLORS.emerald, ring: 'border-emerald-400' },
  diamond: { ...GEM_COLORS.diamond, ring: 'border-slate-200' },
  onyx: { ...GEM_COLORS.onyx, ring: 'border-slate-500' },
  gold: {
    name: 'Gold (Wild)',
    primary: '#f59e0b',
    secondary: '#b45309',
    border: '#fde047',
    glow: 'rgba(245, 158, 11, 0.8)',
    ring: 'border-amber-400',
  },
};

export const ALL_GEMS: GemType[] = ['ruby', 'sapphire', 'emerald', 'diamond', 'onyx'];
export const ALL_TOKENS: TokenType[] = ['ruby', 'sapphire', 'emerald', 'diamond', 'onyx', 'gold'];

// Authentic Splendor Noble Patrons
export const NOBLE_TILES: NobleTile[] = [
  {
    id: 'noble_catherine',
    name: 'Catherine de Medici',
    prestigePoints: 3,
    requirements: { ruby: 3, emerald: 3, diamond: 3 },
    avatar: '👑',
    flavorText: 'Patroness of the French Renaissance court and master gem collector.',
  },
  {
    id: 'noble_ferdinand',
    name: 'Ferdinand I of Austria',
    prestigePoints: 3,
    requirements: { ruby: 4, diamond: 4 },
    avatar: '⚜️',
    flavorText: 'Imperial monarch commanding vast Alpine silver and ruby mines.',
  },
  {
    id: 'noble_isabella',
    name: 'Isabella I of Castile',
    prestigePoints: 3,
    requirements: { diamond: 4, sapphire: 4 },
    avatar: '👸',
    flavorText: 'Financier of oceanic expeditions laden with Caribbean gems.',
  },
  {
    id: 'noble_suleiman',
    name: 'Suleiman the Magnificent',
    prestigePoints: 3,
    requirements: { sapphire: 4, emerald: 4 },
    avatar: '👳',
    flavorText: 'Sultan adorned in radiant Colombian emeralds and Turkish sapphires.',
  },
  {
    id: 'noble_henry',
    name: 'Henry VIII of England',
    prestigePoints: 3,
    requirements: { ruby: 4, onyx: 4 },
    avatar: '👑',
    flavorText: 'Tudor sovereign whose coronation regalia glistened with rich onyx.',
  },
  {
    id: 'noble_charles',
    name: 'Charles V, Holy Roman Emperor',
    prestigePoints: 3,
    requirements: { emerald: 4, onyx: 4 },
    avatar: '⚔️',
    flavorText: 'Ruler over an empire on which the sun never set.',
  },
  {
    id: 'noble_francis',
    name: 'Francis I of France',
    prestigePoints: 3,
    requirements: { sapphire: 3, emerald: 3, diamond: 3 },
    avatar: '🎨',
    flavorText: 'Renaissance patron of Leonardo da Vinci and Italian artisans.',
  },
  {
    id: 'noble_mary',
    name: 'Mary Stuart of Scotland',
    prestigePoints: 3,
    requirements: { ruby: 3, sapphire: 3, diamond: 3 },
    avatar: '🏰',
    flavorText: 'Queen crowned with inherited emerald tiaras and diamond brooches.',
  },
  {
    id: 'noble_philip',
    name: 'Philip II of Spain',
    prestigePoints: 3,
    requirements: { ruby: 3, sapphire: 3, onyx: 3 },
    avatar: '🛡️',
    flavorText: 'Devout defender whose treasury processed millions in Andean treasures.',
  },
  {
    id: 'noble_anne',
    name: 'Anne of Brittany',
    prestigePoints: 3,
    requirements: { emerald: 3, sapphire: 3, onyx: 3 },
    avatar: '📿',
    flavorText: 'Twice crowned Queen of France, famed for illuminated gem codices.',
  },
];

// Curated full authentic cards deck across all 3 tiers
export const TIER_1_CARDS: DevelopmentCard[] = [
  // Diamond bonus cards
  { id: 't1_d1', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { sapphire: 1, emerald: 1, ruby: 1, onyx: 1 }, name: 'Surface Quarry', illustration: '⛏️' },
  { id: 't1_d2', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { sapphire: 1, emerald: 2, ruby: 1, onyx: 1 }, name: 'River Panning', illustration: '🌊' },
  { id: 't1_d3', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { sapphire: 2, ruby: 2, onyx: 1 }, name: 'Gemcutter Workshop', illustration: '💎' },
  { id: 't1_d4', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { emerald: 2, ruby: 2 }, name: 'Guild Apprentice', illustration: '🔨' },
  { id: 't1_d5', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { sapphire: 3 }, name: 'Mountain Outpost', illustration: '⛰️' },
  { id: 't1_d6', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { emerald: 1, ruby: 3, onyx: 1 }, name: 'Merchant Guild', illustration: '⚖️' },
  { id: 't1_d7', tier: 1, gemBonus: 'diamond', prestigePoints: 0, cost: { onyx: 3 }, name: 'Deep Shaft', illustration: '🏮' },
  { id: 't1_d8', tier: 1, gemBonus: 'diamond', prestigePoints: 1, cost: { sapphire: 4 }, name: 'Facet Polisher', illustration: '✨' },

  // Sapphire bonus cards
  { id: 't1_s1', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { diamond: 1, emerald: 1, ruby: 1, onyx: 1 }, name: 'Harbor Warehouse', illustration: '⚓' },
  { id: 't1_s2', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { diamond: 1, emerald: 1, ruby: 2, onyx: 1 }, name: 'Coastal Docks', illustration: '⛵' },
  { id: 't1_s3', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { diamond: 1, emerald: 2, ruby: 2 }, name: 'Ocean Trading Post', illustration: '🧭' },
  { id: 't1_s4', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { ruby: 2, onyx: 2 }, name: 'Smelting Foundry', illustration: '🔥' },
  { id: 't1_s5', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { emerald: 3 }, name: 'Sapphire Creek', illustration: '💧' },
  { id: 't1_s6', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { diamond: 1, ruby: 1, onyx: 3 }, name: 'Lapidary Studio', illustration: '🔎' },
  { id: 't1_s7', tier: 1, gemBonus: 'sapphire', prestigePoints: 0, cost: { diamond: 3 }, name: 'Highland Cave', illustration: '⛏️' },
  { id: 't1_s8', tier: 1, gemBonus: 'sapphire', prestigePoints: 1, cost: { ruby: 4 }, name: 'Azure Caravan', illustration: '🐪' },

  // Emerald bonus cards
  { id: 't1_e1', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { diamond: 1, sapphire: 1, ruby: 1, onyx: 1 }, name: 'Forest Prospector', illustration: '🌲' },
  { id: 't1_e2', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { diamond: 2, sapphire: 1, ruby: 1, onyx: 1 }, name: 'River Sluice', illustration: '🏞️' },
  { id: 't1_e3', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { sapphire: 1, ruby: 2, onyx: 2 }, name: 'Valley Mine', illustration: '⛰️' },
  { id: 't1_e4', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { diamond: 2, sapphire: 2 }, name: 'Apprentice Carver', illustration: '🪓' },
  { id: 't1_e5', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { ruby: 3 }, name: 'Emerald Crevasse', illustration: '🌿' },
  { id: 't1_e6', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { diamond: 3, sapphire: 1, onyx: 1 }, name: 'Merchant Bazaar', illustration: '🎪' },
  { id: 't1_e7', tier: 1, gemBonus: 'emerald', prestigePoints: 0, cost: { sapphire: 3 }, name: 'Alpine Vein', illustration: '⛏️' },
  { id: 't1_e8', tier: 1, gemBonus: 'emerald', prestigePoints: 1, cost: { onyx: 4 }, name: 'Master Grinder', illustration: '✨' },

  // Ruby bonus cards
  { id: 't1_r1', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 1, sapphire: 1, emerald: 1, onyx: 1 }, name: 'Bedouin Trader', illustration: '🏜️' },
  { id: 't1_r2', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 2, sapphire: 1, emerald: 1, onyx: 1 }, name: 'Desert Oasis', illustration: '🌴' },
  { id: 't1_r3', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 2, sapphire: 2, onyx: 1 }, name: 'Volcanic Pit', illustration: '🌋' },
  { id: 't1_r4', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 2, onyx: 2 }, name: 'Red Smithy', illustration: '⚒️' },
  { id: 't1_r5', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 3 }, name: 'Gorge Tunnel', illustration: '🚇' },
  { id: 't1_r6', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { diamond: 1, sapphire: 3, emerald: 1 }, name: 'Silk Route Post', illustration: '📜' },
  { id: 't1_r7', tier: 1, gemBonus: 'ruby', prestigePoints: 0, cost: { emerald: 3 }, name: 'Magma Chamber', illustration: '🔥' },
  { id: 't1_r8', tier: 1, gemBonus: 'ruby', prestigePoints: 1, cost: { diamond: 4 }, name: 'Crown Jeweler', illustration: '👑' },

  // Onyx bonus cards
  { id: 't1_o1', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { diamond: 1, sapphire: 1, emerald: 1, ruby: 1 }, name: 'Catacomb Excavation', illustration: '🕯️' },
  { id: 't1_o2', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { diamond: 1, sapphire: 2, emerald: 1, ruby: 1 }, name: 'Night Vault', illustration: '🗝️' },
  { id: 't1_o3', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { diamond: 1, emerald: 2, ruby: 2 }, name: 'Blacksmith Guild', illustration: '🛡️' },
  { id: 't1_o4', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { emerald: 2, sapphire: 2 }, name: 'Subterranean Cavern', illustration: '🦇' },
  { id: 't1_o5', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { ruby: 3 }, name: 'Obsidian Quarry', illustration: '⛏️' },
  { id: 't1_o6', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { diamond: 1, sapphire: 1, emerald: 3 }, name: 'Curio Dealer', illustration: '🏺' },
  { id: 't1_o7', tier: 1, gemBonus: 'onyx', prestigePoints: 0, cost: { diamond: 3 }, name: 'Coal Deposit', illustration: '🪨' },
  { id: 't1_o8', tier: 1, gemBonus: 'onyx', prestigePoints: 1, cost: { emerald: 4 }, name: 'Dark Polisher', illustration: '💎' },
];

export const TIER_2_CARDS: DevelopmentCard[] = [
  // Diamond
  { id: 't2_d1', tier: 2, gemBonus: 'diamond', prestigePoints: 1, cost: { emerald: 3, ruby: 2, onyx: 2 }, name: 'Florentine Gallery', illustration: '🏛️' },
  { id: 't2_d2', tier: 2, gemBonus: 'diamond', prestigePoints: 2, cost: { ruby: 5 }, name: 'Royal Mint', illustration: '🪙' },
  { id: 't2_d3', tier: 2, gemBonus: 'diamond', prestigePoints: 2, cost: { sapphire: 4, emerald: 2, ruby: 1 }, name: 'Crystal Conservatory', illustration: '🏰' },
  { id: 't2_d4', tier: 2, gemBonus: 'diamond', prestigePoints: 3, cost: { diamond: 6 }, name: 'Grand Diamond Hall', illustration: '💎' },

  // Sapphire
  { id: 't2_s1', tier: 2, gemBonus: 'sapphire', prestigePoints: 1, cost: { diamond: 2, emerald: 3, ruby: 2 }, name: 'Venetian Merchant Galleon', illustration: '⛵' },
  { id: 't2_s2', tier: 2, gemBonus: 'sapphire', prestigePoints: 2, cost: { sapphire: 5 }, name: 'Naval Admiralty', illustration: '⚓' },
  { id: 't2_s3', tier: 2, gemBonus: 'sapphire', prestigePoints: 2, cost: { diamond: 2, emerald: 1, onyx: 4 }, name: 'Maritime Cartographer', illustration: '🗺️' },
  { id: 't2_s4', tier: 2, gemBonus: 'sapphire', prestigePoints: 3, cost: { sapphire: 6 }, name: 'Archduke Observatory', illustration: '🔭' },

  // Emerald
  { id: 't2_e1', tier: 2, gemBonus: 'emerald', prestigePoints: 1, cost: { diamond: 3, sapphire: 2, onyx: 2 }, name: 'Botanical Sanctuary', illustration: '🌿' },
  { id: 't2_e2', tier: 2, gemBonus: 'emerald', prestigePoints: 2, cost: { diamond: 4, ruby: 2, onyx: 1 }, name: 'Gilded Foundry', illustration: '🏰' },
  { id: 't2_e3', tier: 2, gemBonus: 'emerald', prestigePoints: 2, cost: { onyx: 5 }, name: 'Spice Route Fortress', illustration: '🏯' },
  { id: 't2_e4', tier: 2, gemBonus: 'emerald', prestigePoints: 3, cost: { emerald: 6 }, name: 'Emerald Treasury', illustration: '👑' },

  // Ruby
  { id: 't2_r1', tier: 2, gemBonus: 'ruby', prestigePoints: 1, cost: { diamond: 2, sapphire: 3, onyx: 2 }, name: 'Renaissance Armory', illustration: '⚔️' },
  { id: 't2_r2', tier: 2, gemBonus: 'ruby', prestigePoints: 2, cost: { diamond: 5 }, name: 'Imperial Bastion', illustration: '🏰' },
  { id: 't2_r3', tier: 2, gemBonus: 'ruby', prestigePoints: 2, cost: { sapphire: 1, emerald: 4, onyx: 2 }, name: 'Caravan Oasis Palace', illustration: '🕌' },
  { id: 't2_r4', tier: 2, gemBonus: 'ruby', prestigePoints: 3, cost: { ruby: 6 }, name: 'Grand Ruby Sceptre', illustration: '🔮' },

  // Onyx
  { id: 't2_o1', tier: 2, gemBonus: 'onyx', prestigePoints: 1, cost: { diamond: 3, sapphire: 2, emerald: 2 }, name: 'Secret Vault', illustration: '🗝️' },
  { id: 't2_o2', tier: 2, gemBonus: 'onyx', prestigePoints: 2, cost: { diamond: 1, sapphire: 4, emerald: 2 }, name: 'Alchemist Laboratory', illustration: '🧪' },
  { id: 't2_o3', tier: 2, gemBonus: 'onyx', prestigePoints: 2, cost: { emerald: 5 }, name: 'Shadow Syndicate', illustration: '🕵️' },
  { id: 't2_o4', tier: 2, gemBonus: 'onyx', prestigePoints: 3, cost: { onyx: 6 }, name: 'Obsidian Citadel', illustration: '🏯' },
];

export const TIER_3_CARDS: DevelopmentCard[] = [
  // Diamond
  { id: 't3_d1', tier: 3, gemBonus: 'diamond', prestigePoints: 3, cost: { sapphire: 3, emerald: 3, ruby: 5, onyx: 3 }, name: 'Vatican Basilica', illustration: '⛪' },
  { id: 't3_d2', tier: 3, gemBonus: 'diamond', prestigePoints: 4, cost: { onyx: 7 }, name: 'Palace of Versailles', illustration: '🏰' },
  { id: 't3_d3', tier: 3, gemBonus: 'diamond', prestigePoints: 4, cost: { diamond: 3, ruby: 3, onyx: 6 }, name: 'Emperor Sovereign Crown', illustration: '👑' },
  { id: 't3_d4', tier: 3, gemBonus: 'diamond', prestigePoints: 5, cost: { diamond: 3, onyx: 7 }, name: 'Celestial Diamond Vault', illustration: '✨' },

  // Sapphire
  { id: 't3_s1', tier: 3, gemBonus: 'sapphire', prestigePoints: 3, cost: { diamond: 3, emerald: 3, ruby: 3, onyx: 5 }, name: 'Venetian Doge Palace', illustration: '🏛️' },
  { id: 't3_s2', tier: 3, gemBonus: 'sapphire', prestigePoints: 4, cost: { diamond: 7 }, name: 'Grand Armada Fleet', illustration: '🚢' },
  { id: 't3_s3', tier: 3, gemBonus: 'sapphire', prestigePoints: 4, cost: { diamond: 6, sapphire: 3, emerald: 3 }, name: 'Sapphire Cathedral', illustration: '⛪' },
  { id: 't3_s4', tier: 3, gemBonus: 'sapphire', prestigePoints: 5, cost: { diamond: 7, sapphire: 3 }, name: 'Azure Astral Globe', illustration: '🌐' },

  // Emerald
  { id: 't3_e1', tier: 3, gemBonus: 'emerald', prestigePoints: 3, cost: { diamond: 5, sapphire: 3, ruby: 3, onyx: 3 }, name: 'Hanging Gardens of Florence', illustration: '🌸' },
  { id: 't3_e2', tier: 3, gemBonus: 'emerald', prestigePoints: 4, cost: { sapphire: 7 }, name: 'Habsburg Emerald Scepter', illustration: '🪄' },
  { id: 't3_e3', tier: 3, gemBonus: 'emerald', prestigePoints: 4, cost: { sapphire: 6, emerald: 3, ruby: 3 }, name: 'Imperial Botanical Guild', illustration: '🌿' },
  { id: 't3_e4', tier: 3, gemBonus: 'emerald', prestigePoints: 5, cost: { sapphire: 7, emerald: 3 }, name: 'Jade Emperor Gateway', illustration: '⛩️' },

  // Ruby
  { id: 't3_r1', tier: 3, gemBonus: 'ruby', prestigePoints: 3, cost: { diamond: 3, sapphire: 5, emerald: 3, onyx: 3 }, name: 'Castilian Royal Alcazar', illustration: '🏰' },
  { id: 't3_r2', tier: 3, gemBonus: 'ruby', prestigePoints: 4, cost: { emerald: 7 }, name: 'Grand Sultan Diadem', illustration: '👑' },
  { id: 't3_r3', tier: 3, gemBonus: 'ruby', prestigePoints: 4, cost: { emerald: 6, ruby: 3, onyx: 3 }, name: 'Red Lion Citadel', illustration: '🦁' },
  { id: 't3_r4', tier: 3, gemBonus: 'ruby', prestigePoints: 5, cost: { emerald: 7, ruby: 3 }, name: 'Phoenix Fire Reliquary', illustration: '🔥' },

  // Onyx
  { id: 't3_o1', tier: 3, gemBonus: 'onyx', prestigePoints: 3, cost: { diamond: 3, sapphire: 3, emerald: 5, ruby: 3 }, name: 'Cathedral of Notre Dame', illustration: '⛪' },
  { id: 't3_o2', tier: 3, gemBonus: 'onyx', prestigePoints: 4, cost: { ruby: 7 }, name: 'Shadow Monarch Throne', illustration: '🪑' },
  { id: 't3_o3', tier: 3, gemBonus: 'onyx', prestigePoints: 4, cost: { diamond: 3, sapphire: 3, onyx: 6 }, name: 'Tower of London Crypt', illustration: '🏰' },
  { id: 't3_o4', tier: 3, gemBonus: 'onyx', prestigePoints: 5, cost: { ruby: 7, onyx: 3 }, name: 'Eternal Eclipse Monument', illustration: '🌑' },
];

export const INITIAL_BANK_BY_PLAYERS: Record<number, Record<TokenType, number>> = {
  2: { ruby: 4, sapphire: 4, emerald: 4, diamond: 4, onyx: 4, gold: 5 },
  3: { ruby: 5, sapphire: 5, emerald: 5, diamond: 5, onyx: 5, gold: 5 },
  4: { ruby: 7, sapphire: 7, emerald: 7, diamond: 7, onyx: 7, gold: 5 },
};

export const NOBLES_COUNT_BY_PLAYERS: Record<number, number> = {
  2: 3,
  3: 4,
  4: 5,
};
