import React from 'react';
import { GemType, TokenType } from '../types/game.ts';
import { GEM_COLORS, TOKEN_COLORS } from '../game/constants.ts';

interface GemIconProps {
  type: TokenType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'gem' | 'chip' | 'disc' | 'token';
  count?: number;
  selected?: boolean;
  disabled?: boolean;
  showGlow?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-11 h-11',
  xl: 'w-14 h-14',
  '2xl': 'w-18 h-18',
};

export const GemIcon: React.FC<GemIconProps> = ({
  type,
  size = 'md',
  variant = 'gem',
  count,
  selected = false,
  disabled = false,
  showGlow = false,
  className = '',
}) => {
  const isGem = type !== 'gold';
  const colors = TOKEN_COLORS[type];
  const sizeClasses = SIZE_MAP[size];

  // Render pure faceted gemstone
  const renderGemGraphic = () => {
    switch (type) {
      case 'ruby':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d6d" />
                <stop offset="40%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
              <linearGradient id="rubyGlint" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff758f" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Emerald/Octagon cut ruby */}
            <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="url(#rubyGrad)" stroke="#fda4af" strokeWidth="2.5" />
            <polygon points="38,22 62,22 78,38 78,62 62,78 38,78 22,62 22,38" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1.5" />
            <polygon points="44,30 56,30 68,42 68,58 56,70 44,70 32,58 32,42" fill="#be123c" />
            <polygon points="30,10 38,22 44,30 32,42 22,38 10,30" fill="url(#rubyGlint)" />
            <polygon points="70,10 62,22 56,30 68,42 78,38 90,30" fill="#ff85a1" fillOpacity="0.4" />
            <circle cx="50" cy="50" r="12" fill="#fff1f2" fillOpacity="0.25" filter="blur(2px)" />
          </svg>
        );

      case 'sapphire':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="45%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <linearGradient id="sapphFacet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Cushion teardrop/oval facet sapphire */}
            <polygon points="50,6 88,32 76,86 24,86 12,32" fill="url(#sapphireGrad)" stroke="#93c5fd" strokeWidth="2.5" />
            <polygon points="50,22 74,40 66,74 34,74 26,40" fill="#1d4ed8" stroke="#dbeafe" strokeWidth="1.5" />
            <polygon points="50,6 50,22 26,40 12,32" fill="url(#sapphFacet)" />
            <polygon points="50,6 88,32 74,40 50,22" fill="#60a5fa" fillOpacity="0.6" />
            <polygon points="50,34 62,48 50,62 38,48" fill="#93c5fd" fillOpacity="0.7" />
          </svg>
        );

      case 'emerald':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="45%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            {/* Classic step cut emerald */}
            <polygon points="26,12 74,12 88,26 88,74 74,88 26,88 12,74 12,26" fill="url(#emeraldGrad)" stroke="#6ee7b7" strokeWidth="2.5" />
            <rect x="24" y="24" width="52" height="52" fill="#047857" stroke="#a7f3d0" strokeWidth="1.5" />
            <polygon points="26,12 74,12 66,24 34,24" fill="#6ee7b7" fillOpacity="0.8" />
            <polygon points="12,26 24,24 24,76 12,74" fill="#a7f3d0" fillOpacity="0.5" />
            <polygon points="88,26 88,74 76,76 76,24" fill="#065f46" />
            <rect x="36" y="36" width="28" height="28" fill="#10b981" />
          </svg>
        );

      case 'diamond':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#f1f5f9" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="prism" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* Brilliant faceted diamond solitaire */}
            <polygon points="22,24 78,24 94,44 50,92 6,44" fill="url(#diamondGrad)" stroke="#ffffff" strokeWidth="2" />
            <polygon points="36,24 64,24 76,44 50,44 24,44" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <polygon points="22,24 36,24 24,44 6,44" fill="url(#prism)" />
            <polygon points="64,24 78,24 94,44 76,44" fill="#93c5fd" fillOpacity="0.5" />
            <polygon points="24,44 50,44 50,92" fill="#e2e8f0" />
            <polygon points="76,44 50,44 50,92" fill="#94a3b8" />
            <polygon points="6,44 24,44 50,92" fill="#f8fafc" />
            <polygon points="94,44 76,44 50,92" fill="#64748b" />
            <circle cx="50" cy="38" r="4" fill="#ffffff" filter="blur(1px)" />
          </svg>
        );

      case 'onyx':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="onyxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="40%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="onyxShine" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Hexagonal volcanic obsidian cut */}
            <polygon points="50,8 90,30 90,74 50,96 10,74 10,30" fill="url(#onyxGrad)" stroke="#94a3b8" strokeWidth="2" />
            <polygon points="50,22 78,38 78,68 50,82 22,68 22,38" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <polygon points="50,8 50,22 22,38 10,30" fill="url(#onyxShine)" />
            <polygon points="50,8 90,30 78,38 50,22" fill="#64748b" fillOpacity="0.5" />
            <polygon points="50,34 66,48 50,68 34,48" fill="#334155" />
            <line x1="28" y1="36" x2="44" y2="28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
          </svg>
        );

      case 'gold':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <radialGradient id="goldCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>
            {/* Gilded Spanish Doubloon with Crown */}
            <circle cx="50" cy="50" r="45" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="3" />
            <circle cx="50" cy="50" r="36" fill="url(#goldCenter)" stroke="#b45309" strokeWidth="2" strokeDasharray="4 2" />
            {/* Crown Emblem */}
            <path
              d="M32 62 L32 50 L38 56 L50 42 L62 56 L68 50 L68 62 Z"
              fill="#78350f"
              stroke="#fef08a"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="40" r="2.5" fill="#fef08a" />
            <circle cx="32" cy="48" r="2" fill="#fef08a" />
            <circle cx="68" cy="48" r="2" fill="#fef08a" />
            <rect x="32" y="62" width="36" height="4" rx="2" fill="#78350f" />
          </svg>
        );
    }
  };

  // Render heavy Casino Poker Chip with grooved edges
  const renderChipGraphic = () => {
    return (
      <div
        className={`relative rounded-full flex items-center justify-center select-none transition-all duration-200 ${sizeClasses} ${
          selected
            ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.9)] ring-4 ring-amber-300'
            : showGlow
            ? 'shadow-[0_0_15px_rgba(255,255,255,0.4)]'
            : 'shadow-lg hover:shadow-xl hover:scale-105'
        } ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-95'} ${className}`}
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${colors.primary} 35%, ${colors.secondary} 85%, #050505 100%)`,
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.6)`,
          border: `2.5px solid ${colors.border}`,
        }}
      >
        {/* Striped chip edge pattern */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 pointer-events-none" />

        {/* Inner Gem Inset */}
        <div className="relative w-3/5 h-3/5 rounded-full flex items-center justify-center bg-black/40 shadow-inner p-0.5">
          {renderGemGraphic()}
        </div>

        {/* Stack Count Badge */}
        {count !== undefined && (
          <div className="absolute -bottom-1 -right-1 bg-slate-950/90 text-amber-300 font-bold text-[11px] px-1.5 py-0.2 rounded-full border border-amber-400/80 shadow-md">
            x{count}
          </div>
        )}
      </div>
    );
  };

  if (variant === 'chip' || variant === 'token') {
    return renderChipGraphic();
  }

  // Variant = 'disc' (small round pip used on card costs)
  if (variant === 'disc') {
    return (
      <div
        className={`relative rounded-full flex items-center justify-center font-bold text-xs select-none shadow-sm ${sizeClasses} ${className}`}
        style={{
          backgroundColor: colors.primary,
          border: `1.5px solid ${colors.border}`,
          boxShadow: `0 0 6px ${colors.glow}`,
        }}
        title={colors.name}
      >
        <div className="w-3/4 h-3/4 flex items-center justify-center">
          {renderGemGraphic()}
        </div>
      </div>
    );
  }

  // Default: variant = 'gem'
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${
        selected ? 'scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : ''
      } ${className}`}
    >
      {renderGemGraphic()}
    </div>
  );
};
