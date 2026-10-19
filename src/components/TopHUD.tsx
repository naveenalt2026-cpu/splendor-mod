import React, { useEffect, useState } from 'react';
import { GameState, GemType, Player } from '../types/game.ts';
import { calculateBonuses } from '../game/rules.ts';
import { ALL_GEMS, GEM_COLORS } from '../game/constants.ts';
import { GemIcon } from './GemIcon.tsx';
import { Volume2, VolumeX, BookOpen, RotateCcw, Settings } from 'lucide-react';
import { sound } from '../game/sound.ts';

interface TopHUDProps {
  state: GameState;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onResetGame: () => void;
  helperText: string;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  state,
  onOpenRules,
  onOpenSettings,
  onOpenHistory,
  onResetGame,
  helperText,
}) => {
  const [muted, setMuted] = useState(sound.getMuted());
  const [turnTimer, setTurnTimer] = useState(30);

  const activePlayer = state.players[state.activePlayerIndex];
  const isHumanTurn = !activePlayer.isAI;
  const humanPlayer = state.players[0];
  const aiPlayers = state.players.slice(1);

  // Turn timer countdown
  useEffect(() => {
    setTurnTimer(30);
    const interval = setInterval(() => {
      setTurnTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.activePlayerIndex, state.turnCount]);

  const toggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  const humanBonuses = calculateBonuses(humanPlayer.cards);

  return (
    <header className="relative w-full z-20 px-3 py-2 bg-gradient-to-b from-slate-950 via-slate-900/90 to-transparent border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Player 1 Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Avatar Frame with Gold Ring */}
            <div
              className={`w-13 h-13 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                state.activePlayerIndex === 0
                  ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)] bg-gradient-to-tr from-amber-950 to-slate-900'
                  : 'border-slate-700 bg-slate-900/80'
              }`}
            >
              {humanPlayer.avatar}
            </div>
            {/* VP Badge */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-xs px-1.5 py-0.5 rounded-full border border-amber-300 shadow">
              {humanPlayer.prestigePoints} pts
            </div>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="font-['Cinzel'] font-bold text-amber-100 text-sm flex items-center gap-1.5">
              {humanPlayer.name}
              {state.activePlayerIndex === 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </span>
            <span className="text-[11px] text-amber-300/80 font-medium">
              Target: {state.targetVP} VP to Win
            </span>
            {/* Quick mini gem bonus badges */}
            <div className="flex items-center gap-1 mt-0.5">
              {ALL_GEMS.map(gem => {
                const bonus = humanBonuses[gem] || 0;
                if (bonus === 0) return null;
                return (
                  <div
                    key={gem}
                    className="flex items-center gap-0.5 text-[10px] text-slate-200 bg-slate-900/90 px-1 rounded border border-slate-700"
                    title={`${bonus} ${gem} discount bonus`}
                  >
                    <GemIcon type={gem} size="xs" variant="gem" />
                    <span>+{bonus}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Glowing Turn Banner (Matching Reference Image) */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-lg">
          {/* Renaissance Plaque Banner */}
          <div className="relative px-6 py-1 rounded-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.35)] flex items-center justify-center gap-3">
            <div className="w-2 h-2 rotate-45 bg-amber-400" />
            <span className="font-['Cinzel'] font-black tracking-widest text-amber-200 text-xs sm:text-sm uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {activePlayer.isAI
                ? `${activePlayer.name.toUpperCase()}'S TURN`
                : "PLAYER 1'S TURN"}
            </span>
            <div className="w-2 h-2 rotate-45 bg-amber-400" />

            {/* Timer Pill */}
            <div className="ml-1 px-2 py-0.5 rounded-full bg-black/60 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
              <span>0:{turnTimer < 10 ? `0${turnTimer}` : turnTimer}</span>
            </div>
          </div>

          {/* Helper action instruction text */}
          <div className="mt-1 text-[11px] sm:text-xs font-['Cinzel'] font-semibold tracking-wider text-amber-300/90 drop-shadow flex items-center gap-1.5 text-center px-2">
            {activePlayer.isAI ? (
              <span className="text-cyan-300 flex items-center gap-1 animate-pulse">
                <span>Thinking strategic moves...</span>
              </span>
            ) : (
              <span>{helperText || 'SELECT A CARD TO BUY OR RESERVE'}</span>
            )}
          </div>
        </div>

        {/* Right: AI Opponents + Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* AI Player Profiles */}
          <div className="flex items-center gap-2">
            {aiPlayers.map((ai, index) => {
              const aiIndex = index + 1;
              const isActive = state.activePlayerIndex === aiIndex;
              const aiBonuses = calculateBonuses(ai.cards);

              return (
                <div
                  key={ai.id}
                  className={`flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl border transition-all ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/60'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                  title={`${ai.name} (${ai.difficulty}): ${ai.prestigePoints} VP, ${ai.cards.length} cards, ${ai.reservedCards.length} reserved`}
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-lg">
                      {ai.avatar}
                    </div>
                    {/* VP */}
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 text-amber-300 font-bold text-[10px] px-1 rounded-full border border-amber-500/50">
                      {ai.prestigePoints}
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col">
                    <span className="text-[11px] font-['Cinzel'] font-bold text-slate-200 truncate max-w-[80px]">
                      {ai.name.replace('AI ', '')}
                    </span>
                    <span className="text-[9px] text-slate-400 capitalize">
                      {ai.difficulty} • {ai.cards.length} cards
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Utility Buttons: Sound, Rules, Settings, Restart */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors"
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button
              onClick={onOpenRules}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors"
              title="Game Rules"
              aria-label="View Game Rules"
            >
              <BookOpen size={16} />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors"
              title="Game Settings"
              aria-label="Game Settings"
            >
              <Settings size={16} />
            </button>

            <button
              onClick={onResetGame}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/50 transition-colors"
              title="New Match"
              aria-label="Restart Match"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
