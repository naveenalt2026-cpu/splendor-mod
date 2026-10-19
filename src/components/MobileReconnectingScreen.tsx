import React from 'react';
import { Crown, Loader2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface MobileReconnectingScreenProps {
  sessionId: string;
  playerName: string;
  avatar: string;
  errorMessage: string | null;
  onCancel: () => void;
  onManualRetry?: () => void;
}

export const MobileReconnectingScreen: React.FC<MobileReconnectingScreenProps> = ({
  sessionId,
  playerName,
  avatar,
  errorMessage,
  onCancel,
  onManualRetry,
}) => {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-center p-4 relative select-none font-sans">
      {/* Background ambient gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-radial from-amber-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-2xl flex flex-col items-center relative z-10 text-center">
        {/* Renaissance Avatar Badge */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-[#0B0F1A] border-2 border-amber-400/80 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            {avatar || '👑'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-[#121826] flex items-center justify-center text-slate-950 shadow-md">
            <Loader2 size={16} className="animate-spin stroke-[2.5]" />
          </div>
        </div>

        <h1 className="font-['Cinzel'] font-black text-xl text-amber-200 tracking-wider">
          {playerName}
        </h1>

        <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-mono text-xs font-bold text-amber-300">
            Table #{sessionId}
          </span>
        </div>

        {/* Status text */}
        <div className="mt-6 mb-4 flex flex-col items-center gap-2">
          <p className="font-['Cinzel'] font-bold text-sm text-amber-100/90 tracking-wide">
            RECONNECTING TO MATCH...
          </p>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Welcome back! Resuming your seat with all your cards, gems, and turn progress.
          </p>
        </div>

        {errorMessage && (
          <div className="w-full mt-2 mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span className="text-left leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {onManualRetry && (
            <button
              type="button"
              onClick={onManualRetry}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-['Cinzel'] font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw size={14} className="stroke-[2.5]" />
              <span>Retry Connection</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-['Cinzel'] font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-white/10 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Leave / Choose Another Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
