import React, { useEffect, useState } from 'react';
import { NobleTile } from '../types/game.ts';
import { Crown, Sparkles, Trophy, Check } from 'lucide-react';
import { sound } from '../game/sound.ts';
import { GemIcon } from './GemIcon.tsx';

interface NobleClaimCelebrationProps {
  noble: NobleTile;
  playerName: string;
  isHuman: boolean;
  onComplete: () => void;
}

export const NobleClaimCelebration: React.FC<NobleClaimCelebrationProps> = ({
  noble,
  playerName,
  isHuman,
  onComplete,
}) => {
  // Stages: 'fanfare' (showcase in center/dais) -> 'gliding' (smooth transition to tableau) -> 'docked' (impact ripple)
  const [stage, setStage] = useState<'fanfare' | 'gliding' | 'docked'>('fanfare');

  useEffect(() => {
    // Play majestic fanfare
    sound.playNobleVisit();

    const glideTimer = setTimeout(() => {
      setStage('gliding');
    }, 1500);

    const dockTimer = setTimeout(() => {
      setStage('docked');
      sound.playBuyCard();
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3600);

    return () => {
      clearTimeout(glideTimer);
      clearTimeout(dockTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Handle escape / enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md select-none cursor-pointer overflow-hidden animate-fade-in"
      role="dialog"
      aria-label="Noble Patron Claimed Celebration"
    >
      {/* Background Rotating Sunbeams / God Rays */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div
          className="w-[1000px] h-[1000px] rounded-full opacity-30 animate-spin"
          style={{
            animationDuration: '28s',
            background: `conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, rgba(251, 191, 36, 0.45) 15deg, transparent 30deg, 
              rgba(251, 191, 36, 0.45) 45deg, transparent 60deg, 
              rgba(251, 191, 36, 0.45) 75deg, transparent 90deg, 
              rgba(251, 191, 36, 0.45) 105deg, transparent 120deg, 
              rgba(251, 191, 36, 0.45) 135deg, transparent 150deg, 
              rgba(251, 191, 36, 0.45) 165deg, transparent 180deg, 
              rgba(251, 191, 36, 0.45) 195deg, transparent 210deg, 
              rgba(251, 191, 36, 0.45) 225deg, transparent 240deg, 
              rgba(251, 191, 36, 0.45) 255deg, transparent 270deg, 
              rgba(251, 191, 36, 0.45) 285deg, transparent 300deg, 
              rgba(251, 191, 36, 0.45) 315deg, transparent 330deg, 
              rgba(251, 191, 36, 0.45) 345deg, transparent 360deg
            )`,
          }}
        />

        {/* Central Radial Golden Bloom */}
        <div className="absolute w-[700px] h-[700px] rounded-full bg-radial from-amber-400/40 via-yellow-600/20 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* Radiant Glowing Arc Trail Connecting Dais to Tableau */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-700 ${
          stage !== 'fanfare' ? 'opacity-90' : 'opacity-40'
        }`}
        viewBox="0 0 1000 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="beamGrad" x1="88%" y1="28%" x2="62%" y2="92%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#fde047" stopOpacity="1" />
            <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
          </linearGradient>
          <filter id="beamGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Curved Glowing Trajectory Path from Dais to Tableau */}
        <path
          d={
            isHuman
              ? 'M 880 260 C 700 240, 520 480, 620 740'
              : 'M 880 260 C 840 180, 820 120, 840 70'
          }
          fill="none"
          stroke="url(#beamGrad)"
          strokeWidth="6"
          filter="url(#beamGlow)"
          strokeDasharray="20 10"
          className="animate-pulse"
        />
      </svg>

      {/* Floating Sparkle Confetti Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
        {[...Array(28)].map((_, i) => {
          const angle = (i / 28) * 360;
          const delay = (i % 7) * 0.12;
          const distance = 180 + (i % 6) * 55;
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
              style={{
                background:
                  i % 3 === 0 ? '#fde047' : i % 3 === 1 ? '#60a5fa' : '#34d399',
                boxShadow: '0 0 12px #fbbf24',
                transform: `rotate(${angle}deg) translate(${distance}px)`,
                animation: `pulse 1.6s ease-in-out infinite alternate`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {/* Header Announcement Ribbon - Fixed at top */}
      <div
        className={`absolute top-6 sm:top-10 inset-x-0 mx-auto text-center z-25 transition-all duration-700 px-4 ${
          stage === 'fanfare'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-70 -translate-y-2 scale-95'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.7)] mb-2">
          <Crown className="text-amber-300 animate-bounce" size={18} />
          <span className="font-['Cinzel'] font-black tracking-widest text-amber-200 text-xs sm:text-sm uppercase drop-shadow">
            NOBLE PATRONAGE BESTOWED!
          </span>
          <Crown className="text-amber-300 animate-bounce" size={18} />
        </div>

        <h2 className="font-['Cinzel'] font-black text-2xl sm:text-4xl text-amber-100 uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
          {noble.name}
        </h2>
        <p className="font-['Cinzel'] text-xs sm:text-sm text-amber-300 font-semibold mt-1 max-w-lg mx-auto">
          {isHuman
            ? `Favors your burgeoning gem empire with an endowment of +3 Prestige Points!`
            : `${playerName} has secured the allegiance of this illustrious noble patron!`}
        </p>
      </div>

      {/* The Noble Card: Starts Elevated at Center/Dais -> Swoops & Glides Down to Tableau */}
      <div
        className={`relative z-30 transition-all ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          stage === 'fanfare'
            ? 'duration-700 scale-105 translate-x-0 -translate-y-4 rotate-0'
            : stage === 'gliding'
            ? isHuman
              ? 'duration-1200 scale-55 translate-x-[120px] translate-y-[310px] sm:translate-y-[330px] rotate-3'
              : 'duration-1200 scale-55 translate-x-[340px] -translate-y-[240px] -rotate-3'
            : isHuman
            ? 'duration-400 scale-35 translate-x-[120px] translate-y-[350px] sm:translate-y-[370px] opacity-0'
            : 'duration-400 scale-35 translate-x-[360px] -translate-y-[260px] opacity-0'
        }`}
      >
        {/* Glowing comet aura trail when gliding */}
        {stage === 'gliding' && (
          <div className="absolute -inset-12 rounded-full bg-gradient-to-t from-amber-400/50 via-yellow-500/30 to-transparent blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Noble Card Body */}
        <div className="relative w-60 sm:w-68 rounded-2xl border-4 border-amber-300 bg-gradient-to-b from-amber-950/95 via-slate-900 to-slate-950 p-4 shadow-[0_0_60px_rgba(251,191,36,0.9)] text-center">
          {/* Corner golden filigree */}
          <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
          <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
          <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
          <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-300" />

          {/* Top Row: Prestige Points & Crown */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm px-3 py-1 rounded-full shadow-lg border border-yellow-100">
              <Trophy size={15} />
              <span>+3 VP</span>
            </div>
            <div className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {noble.avatar}
            </div>
          </div>

          {/* Noble Illustration / Portrait Canvas */}
          <div className="relative h-28 rounded-xl bg-gradient-to-b from-amber-900/40 via-black to-slate-950 border border-amber-500/40 flex flex-col items-center justify-center p-2 mb-3 shadow-inner">
            <div className="text-5xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transform hover:scale-110 transition-transform">
              {noble.avatar}
            </div>
            <div className="font-['Cinzel'] font-black text-amber-200 text-sm mt-1.5 truncate max-w-full">
              {noble.name}
            </div>
          </div>

          {/* Flavor Text */}
          {noble.flavorText && (
            <p className="text-[11px] text-amber-100/90 italic mb-3 font-serif line-clamp-2 px-1">
              "{noble.flavorText}"
            </p>
          )}

          {/* Satisfied Requirements Badges */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-amber-500/30">
            {Object.entries(noble.requirements).map(([gem, count]) => (
              <div
                key={gem}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-bold shadow"
              >
                <GemIcon type={gem as any} size="xs" variant="gem" />
                <span>{count}</span>
                <Check size={12} className="text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Golden Shockwave on Landing into Tableau (Docked stage) */}
      {stage === 'docked' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border-4 border-amber-300 bg-amber-400/25 animate-ping pointer-events-none" />
      )}

      {/* Tap to Skip Prompt at bottom */}
      <div className="absolute bottom-4 text-center text-xs font-['Cinzel'] tracking-widest text-amber-200/70 hover:text-amber-200 uppercase transition-colors z-30">
        <span>Click anywhere or press Space to continue</span>
      </div>
    </div>
  );
};
