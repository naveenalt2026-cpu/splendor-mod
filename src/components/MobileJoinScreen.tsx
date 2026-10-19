import React, { useState } from 'react';
import { Crown, Sparkles, Smartphone, ArrowRight } from 'lucide-react';

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
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [playerName, setPlayerName] = useState(
    RENAISSANCE_NAMES[Math.floor(Math.random() * RENAISSANCE_NAMES.length)]
  );
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) return;
    onJoin(sessionId.trim().toUpperCase(), playerName.trim() || 'Player', selectedAvatar);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-center p-4 relative select-none font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm p-6 rounded-3xl bg-[#121826] border border-white/8 shadow-2xl flex flex-col items-center relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] mb-3">
          <Smartphone size={26} className="stroke-[2.5]" />
        </div>

        <h1 className="font-['Cinzel'] font-black text-xl text-amber-200 tracking-wider text-center">
          JOIN SPLENDOR MATCH
        </h1>
        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          Connected as a mobile player to the central Table Host.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F1A] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-['Cinzel'] font-black text-center text-lg text-amber-300 tracking-widest outline-none"
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
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F1A] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium text-sm text-slate-100 outline-none transition-colors"
              required
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-[11px] font-['Cinzel'] font-bold text-amber-300 uppercase tracking-wider mb-1">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
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
            className="mt-3 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-['Cinzel'] font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-transform"
          >
            <span>ENTER MATCH</span>
            <ArrowRight size={18} className="stroke-[3]" />
          </button>
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
