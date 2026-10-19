import React, { useState } from 'react';
import { Crown, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { getStoredPlayerSession } from '../utils/sessionStorage.ts';

interface MobileJoinScreenProps {
  initialSessionId: string;
  onJoin: (sessionId: string, playerName: string, avatar: string) => void;
  onSwitchToHost: () => void;
}

const RENAISSANCE_NAMES = ['Lorenzo', 'Isabella', 'Leonardo', 'Caterina', 'Michelangelo', 'Beatrice'];
const AVATARS = ['👑', '👸', '🧙‍♂️', '🧝‍♂️', '🧔', '🎨', '⚔️', '💎'];

export const MobileJoinScreen: React.FC<MobileJoinScreenProps> = ({
  initialSessionId,
  onJoin,
  onSwitchToHost,
}) => {
  const stored = getStoredPlayerSession();
  const [sessionId, setSessionId] = useState(initialSessionId || stored?.sessionId || '');
  const [playerName, setPlayerName] = useState(
    stored?.playerName || RENAISSANCE_NAMES[Math.floor(Math.random() * RENAISSANCE_NAMES.length)]
  );
  const [selectedAvatar, setSelectedAvatar] = useState(stored?.avatar || AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) return;
    onJoin(sessionId.trim().toUpperCase(), playerName.trim() || 'Player', selectedAvatar);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-center p-4 relative select-none font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm landscape:max-w-2xl p-5 sm:p-6 landscape:p-4 rounded-3xl bg-[#121826] border border-white/8 shadow-2xl flex flex-col items-center relative z-10 max-h-[96vh] overflow-y-auto">
        <div className="w-12 h-12 landscape:w-10 landscape:h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] mb-2">
          <Smartphone size={22} className="stroke-[2.5]" />
        </div>

        <h1 className="font-['Cinzel'] font-black text-lg sm:text-xl text-amber-200 tracking-wider text-center">
          JOIN SPLENDOR MATCH
        </h1>
        <p className="text-xs text-slate-400 text-center mt-0.5 mb-3 landscape:mb-2">
          Connected as a mobile player to the central Table Host.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col landscape:grid landscape:grid-cols-2 gap-3 sm:gap-4">
          {/* Left Column in Landscape: Code & Name */}
          <div className="flex flex-col gap-3">
            {/* Room Code Input */}
            <div>
              <label className="block text-[11px] font-['Cinzel'] font-bold text-amber-300 uppercase tracking-wider mb-1">
                Room Session Code
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={e => setSessionId(e.target.value.toUpperCase())}
                placeholder="e.g. GEM-492"
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F1A] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-['Cinzel'] font-black text-center text-base sm:text-lg text-amber-300 tracking-widest outline-none"
                required
              />
            </div>

            {/* Player Name Input */}
            <div>
              <label className="block text-[11px] font-['Cinzel'] font-bold text-amber-300 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={16}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F1A] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium text-sm text-slate-100 outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Right Column in Landscape: Avatar & Enter Match */}
          <div className="flex flex-col gap-3 justify-between">
            {/* Avatar Selector */}
            <div>
              <label className="block text-[11px] font-['Cinzel'] font-bold text-amber-300 uppercase tracking-wider mb-1">
                Choose Avatar
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`h-9 sm:h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                      selectedAvatar === avatar
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md shadow-amber-500/10'
                        : 'bg-[#0B0F1A] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Join Button */}
            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-['Cinzel'] font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-transform"
            >
              <span>ENTER MATCH</span>
              <ArrowRight size={16} className="stroke-[3]" />
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 w-full text-center">
          <button
            type="button"
            onClick={onSwitchToHost}
            className="text-xs text-slate-400 hover:text-amber-300 font-['Cinzel'] underline cursor-pointer"
          >
            Switch to TV / Table Host Mode
          </button>
        </div>
      </div>
    </div>
  );
};
