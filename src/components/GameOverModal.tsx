import React from 'react';
import { GameState } from '../types/game.ts';
import { Trophy, Crown, RotateCcw, Award } from 'lucide-react';
import { sound } from '../game/sound.ts';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart }) => {
  if (state.status !== 'game_over') return null;

  const winner = state.players.find(p => p.id === state.winnerId) || state.players[0];
  const isHumanWinner = !winner.isAI;

  // Ranked leaderboard
  const rankedPlayers = [...state.players].sort((a, b) => {
    if (b.prestigePoints !== a.prestigePoints) {
      return b.prestigePoints - a.prestigePoints;
    }
    return a.cards.length - b.cards.length; // tie breaker: fewest cards
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.4)] p-6 sm:p-8 text-center text-slate-100">
        {/* Crown & Laurel */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-4xl shadow-xl border-2 border-amber-200">
            {winner.avatar}
          </div>
          <div className="absolute -top-2 -right-2 bg-slate-950 text-amber-400 p-1.5 rounded-full border border-amber-400 shadow">
            <Crown size={20} />
          </div>
        </div>

        <h2 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-300 uppercase tracking-widest drop-shadow-md">
          {isHumanWinner ? 'Glory & Triumph!' : 'Match Concluded'}
        </h2>

        <p className="font-['Cinzel'] text-sm sm:text-base text-amber-100/90 mt-1 mb-6">
          <strong className="text-amber-300 font-bold">{winner.name}</strong> has emerged as the Grandmaster Gem Trader!
        </p>

        {/* Leaderboard Table */}
        <div className="space-y-2 mb-6">
          {rankedPlayers.map((p, idx) => {
            const isTop = idx === 0;
            const noblesPoints = p.nobles.reduce((sum, n) => sum + n.prestigePoints, 0);
            const cardsPoints = p.prestigePoints - noblesPoints;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isTop
                    ? 'border-amber-400 bg-amber-950/40 shadow-md ring-1 ring-amber-400/60'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-['Cinzel'] font-bold text-amber-400 text-base w-4">
                    #{idx + 1}
                  </span>
                  <span className="text-xl">{p.avatar}</span>
                  <div className="text-left">
                    <span className="font-['Cinzel'] font-bold text-slate-100 text-xs sm:text-sm block">
                      {p.name} {p.isAI && `(${p.difficulty})`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {p.cards.length} cards bought • {p.nobles.length} noble visits
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-['Cinzel'] font-black text-amber-300 text-lg sm:text-xl block">
                    {p.prestigePoints} <span className="text-xs font-normal">VP</span>
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Cards: {cardsPoints} | Nobles: {noblesPoints}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Play Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-['Cinzel'] font-black text-sm uppercase tracking-widest shadow-xl cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          <span>Play Rematch</span>
        </button>
      </div>
    </div>
  );
};
