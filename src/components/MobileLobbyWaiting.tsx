import React from 'react';
import { Crown, Sparkles, Tv, CheckCircle2 } from 'lucide-react';
import { SessionPlayer } from '../types/multiplayer.ts';

interface MobileLobbyWaitingProps {
  sessionId: string;
  myPlayerName: string;
  myAvatar: string;
  myPlayerIndex: number;
  lobbyPlayers: SessionPlayer[];
}

export const MobileLobbyWaiting: React.FC<MobileLobbyWaitingProps> = ({
  sessionId,
  myPlayerName,
  myAvatar,
  myPlayerIndex,
  lobbyPlayers,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 select-none relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-radial from-amber-500/20 via-yellow-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-sm flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-amber-400" />
          <span className="font-['Cinzel'] font-bold text-amber-200 text-sm">
            SPLENDOR LOBBY
          </span>
        </div>
        <span className="text-xs bg-amber-950/80 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full font-bold">
          {sessionId}
        </span>
      </header>

      {/* Center Status Card */}
      <main className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex flex-col items-center text-center z-10 my-auto">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-xl">
            {myAvatar}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <h2 className="font-['Cinzel'] font-black text-xl text-amber-100 tracking-wide">
          {myPlayerName}
        </h2>
        <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>CONNECTED & READY</span>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/80 w-full flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-400 animate-pulse mb-2">
            <Tv size={20} />
          </div>
          <p className="font-['Cinzel'] font-bold text-xs text-amber-300">
            LOOK UP AT THE HOST SCREEN
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Waiting for the Host to start the match. Your cards and turn actions will appear here automatically!
          </p>
        </div>

        {/* Players list */}
        <div className="mt-5 w-full bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 text-left">
          <div className="text-[10px] font-['Cinzel'] text-slate-400 uppercase tracking-wider mb-2">
            Players in Match ({lobbyPlayers.length || 1}/4)
          </div>
          <div className="flex flex-col gap-1.5">
            {lobbyPlayers.map((p, i) => (
              <div key={p.id || i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span>{p.avatar}</span>
                  <span className={p.name === myPlayerName ? 'font-bold text-amber-200' : 'text-slate-300'}>
                    {p.name} {p.name === myPlayerName && '(You)'}
                  </span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-xs text-slate-500 font-['Cinzel'] z-10 text-center">
        Renaissance Tabletop Engine
      </footer>
    </div>
  );
};
