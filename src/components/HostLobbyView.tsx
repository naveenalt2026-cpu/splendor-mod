import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Crown,
  Users,
  Sparkles,
  Copy,
  Check,
  Tv,
  Bot,
  ArrowRight,
  Shield,
  RefreshCw,
  Globe,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { SessionPlayer } from '../types/multiplayer.ts';

interface HostLobbyViewProps {
  sessionId: string;
  joinUrl: string;
  internetJoinUrl?: string | null;
  lanJoinUrl?: string | null;
  players: SessionPlayer[];
  canStart: boolean;
  onStartGame: () => void;
  onAddAI: () => void;
  onExitHost: () => void;
  onCreateNewRoom?: () => void;
}

export const HostLobbyView: React.FC<HostLobbyViewProps> = ({
  sessionId,
  joinUrl,
  internetJoinUrl,
  lanJoinUrl,
  players,
  canStart,
  onStartGame,
  onAddAI,
  onExitHost,
  onCreateNewRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [networkMode, setNetworkMode] = useState<'internet' | 'lan'>('internet');

  // Compute the active scannable URL according to user's network selection
  const activeJoinUrl = (() => {
    if (networkMode === 'lan' && lanJoinUrl) {
      return lanJoinUrl;
    }
    if (internetJoinUrl) {
      return internetJoinUrl;
    }
    if (joinUrl && !joinUrl.includes('localhost') && !joinUrl.includes('127.0.0.1')) {
      return joinUrl.replace(/^http:/, 'https:').replace('ais-dev-', 'ais-pre-');
    }
    return `https://ais-pre-uxxuhyirj6wwedrsnxj43u-748355567623.asia-east1.run.app/?session=${sessionId}&role=player`;
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(activeJoinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-white/8 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Tv size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Cinzel'] font-black text-xl sm:text-2xl text-amber-200 tracking-wider">
                SPLENDOR: MASTER TABLE HOST
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400 text-amber-300">
                <Shield size={10} /> Central Board Only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              One device acts as the dedicated shared board. All players play on their mobile phones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateNewRoom && (
            <button
              type="button"
              onClick={() => {
                if (players.length === 0 || window.confirm('Close this room and generate a new room code?')) {
                  onCreateNewRoom();
                }
              }}
              className="text-xs font-['Cinzel'] font-bold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Close current room and create a new room code"
            >
              <RefreshCw size={13} />
              <span>New Room Code</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitHost}
            className="text-xs font-['Cinzel'] text-slate-400 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-500/40 transition-colors cursor-pointer"
          >
            Exit to Menu
          </button>
        </div>
      </header>

      {/* Main Center Area: Large QR Code + Room Code + Live Player Slots */}
      <main className="w-full max-w-5xl flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 my-6 z-10">
        {/* Left Column: Huge QR Code Card with Network Selector */}
        <div className="flex flex-col items-center bg-[#121826] border border-white/8 p-6 sm:p-7 rounded-3xl shadow-xl text-center max-w-md w-full">
          {/* Network Mode Switcher: Any Network (Internet) vs Local Wi-Fi (LAN) */}
          <div className="w-full mb-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-center p-1 rounded-xl bg-black/60 border border-white/10 gap-1">
              <button
                type="button"
                onClick={() => setNetworkMode('internet')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  networkMode === 'internet'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe size={13} />
                <span>Any Network</span>
              </button>
              <button
                type="button"
                onClick={() => setNetworkMode('lan')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-['Cinzel'] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  networkMode === 'lan'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Wifi size={13} />
                <span>Local Wi-Fi</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-200/90 text-center px-1">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              <span>
                {networkMode === 'internet'
                  ? 'Join from cellular data (5G/4G), different Wi-Fi, or remotely!'
                  : 'Local Wi-Fi: Devices must share the same local router.'}
              </span>
            </div>
          </div>

          {/* Large High-Contrast QR Code */}
          <div className="p-4 bg-[#0B0F1A] rounded-2xl border border-white/10 shadow-xl relative group">
            <QRCodeSVG
              value={activeJoinUrl}
              size={220}
              bgColor="#090d16"
              fgColor="#fbbf24"
              level="H"
              includeMargin
            />
            <div className="absolute inset-0 border-2 border-amber-300/30 rounded-2xl pointer-events-none" />
          </div>

          {/* Room Code Display */}
          <div className="mt-4 w-full">
            <div className="text-[11px] font-['Cinzel'] tracking-widest text-slate-400 uppercase">
              Room Code
            </div>
            <div className="font-['Cinzel'] font-black text-3xl sm:text-4xl text-amber-300 tracking-widest my-1 drop-shadow">
              {sessionId}
            </div>

            {/* Copy Join Link Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 text-xs font-semibold text-slate-200 hover:text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-300">Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-amber-400" />
                  <span>Copy {networkMode === 'internet' ? 'Public' : 'Wi-Fi'} Join Link</span>
                </>
              )}
            </button>

            {/* Direct manual mobile connection helper */}
            <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400 text-left">
              <span className="text-amber-300/90 font-bold block mb-0.5">
                Join from Any Network or Phone:
              </span>
              <span>1. Scan the QR code above with your camera</span>
              <br />
              <span>
                2. Or open:{' '}
                <a
                  href={activeJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 underline font-mono text-[10px] break-all inline-flex items-center gap-1"
                >
                  <span>{activeJoinUrl}</span>
                  <ExternalLink size={10} className="shrink-0" />
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Mobile Players & Game Controls */}
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full h-full min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                <h2 className="font-['Cinzel'] font-bold text-lg text-amber-100">
                  CONNECTED PLAYERS ({players.length}/4)
                </h2>
              </div>
              {players.length < 4 && (
                <button
                  type="button"
                  onClick={onAddAI}
                  className="text-xs font-['Cinzel'] font-bold text-amber-300 hover:text-amber-100 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                  title="Add an AI player to fill a slot"
                >
                  <Bot size={13} />
                  <span>+ Add AI</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              At least 2 players must join. Once everyone is in, press "Start Match" to launch the Table View.
            </p>

            {/* Player Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[0, 1, 2, 3].map((slotIdx) => {
                const player = players[slotIdx];
                if (player) {
                  return (
                    <div
                      key={player.id}
                      className="p-3.5 rounded-2xl bg-[#0B0F1A] border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-3 animate-fade-in"
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                        {player.avatar || '👑'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-['Cinzel'] font-bold text-sm text-amber-100 truncate flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {player.isAI && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-sans">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Connected</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`slot-${slotIdx}`}
                    className="p-3.5 rounded-2xl bg-[#121826]/40 border border-dashed border-white/10 flex items-center gap-3 opacity-60"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 font-['Cinzel'] font-bold shrink-0">
                      {slotIdx + 1}
                    </div>
                    <div>
                      <div className="font-['Cinzel'] text-xs text-slate-400">
                        Slot {slotIdx + 1} Open
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Scan QR code to join
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Area: Start Match */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/8">
            <button
              type="button"
              disabled={!canStart}
              onClick={onStartGame}
              className={`w-full py-3.5 px-6 rounded-2xl font-['Cinzel'] font-black text-sm tracking-widest flex items-center justify-center gap-2 transition-all ${
                canStart
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer hover:scale-[1.01] active:scale-95'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-50'
              }`}
            >
              <span>START MULTIPLAYER MATCH</span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </button>

            <div className="text-center text-xs text-slate-400 min-h-[20px]">
              {!canStart && (
                <span>
                  Need {Math.max(0, 2 - players.length)} more player(s) to commence.
                </span>
              )}
              {canStart && (
                <span className="text-emerald-400 font-semibold">
                  Ready! Press button above to launch the Table View.
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-xs text-slate-500 font-['Cinzel'] z-10 text-center">
        Renaissance Tabletop Engine • Cross-Network Splendor
      </footer>
    </div>
  );
};
