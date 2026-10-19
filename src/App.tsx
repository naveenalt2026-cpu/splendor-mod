import React, { useEffect, useState } from 'react';
import { Crown, Smartphone, Tv, Users } from 'lucide-react';
import { useMultiplayerSocket } from './hooks/useMultiplayerSocket.ts';
import { HostLobbyView } from './components/HostLobbyView.tsx';
import { HostTableView } from './components/HostTableView.tsx';
import { MobilePlayerView } from './components/MobilePlayerView.tsx';
import { MobileJoinScreen } from './components/MobileJoinScreen.tsx';
import { MobileLobbyWaiting } from './components/MobileLobbyWaiting.tsx';
import { MobileReconnectingScreen } from './components/MobileReconnectingScreen.tsx';
import { SoloTableView } from './components/SoloTableView.tsx';
import { getStoredHostSession, getStoredPlayerSession } from './utils/sessionStorage.ts';

type AppMode = 'choose_mode' | 'host' | 'player' | 'solo';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionParam = urlParams.get('session');
  const roleParam = urlParams.get('role');

  const [mode, setMode] = useState<AppMode>(() => {
    const storedPlayer = getStoredPlayerSession();
    const storedHost = getStoredHostSession();
    if (sessionParam && roleParam === 'player') return 'player';
    if (roleParam === 'host') return 'host';
    if (sessionParam) return 'player';
    if (storedPlayer && storedPlayer.sessionId) return 'player';
    if (storedHost && storedHost.sessionId) return 'host';
    return 'choose_mode';
  });

  // Multiplayer WebSocket Hook
  const {
    isConnected,
    isReconnecting,
    sessionId,
    joinUrl,
    myPlayerId,
    myPlayerIndex,
    publicState,
    privateState,
    lobbyPlayers,
    canStart,
    errorMessage,
    storedPlayerSession,
    createHostSession,
    createNewHostRoom,
    closeHostSession,
    joinSession,
    leaveSession,
    reconnectManual,
    addAIPlayer,
    startHostGame,
    restartHostGame,
    sendGameAction,
  } = useMultiplayerSocket();

  // Initialize Host Session when entering host mode if none exists
  useEffect(() => {
    if (mode === 'host' && !sessionId) {
      createHostSession(15);
    }
  }, [mode, sessionId, createHostSession]);

  // -------------------------------------------------------------
  // ROUTE 1: Dedicated Host View (Central Shared Board on TV/Tablet)
  // -------------------------------------------------------------
  if (mode === 'host') {
    // If game has not started yet, show Host Lobby with Large QR Code
    if (!publicState || publicState.status === 'lobby') {
      return (
        <HostLobbyView
          sessionId={sessionId || 'INITIALIZING...'}
          joinUrl={joinUrl || `${window.location.origin}/?session=${sessionId || ''}&role=player`}
          players={lobbyPlayers}
          canStart={canStart}
          onStartGame={startHostGame}
          onAddAI={() => addAIPlayer('medium')}
          onCreateNewRoom={() => createNewHostRoom(15)}
          onExitHost={() => {
            closeHostSession();
            setMode('choose_mode');
          }}
        />
      );
    }

    // Permanent "Table View" (Central Shared Board)
    return (
      <HostTableView
        publicState={publicState}
        onRestartMatch={restartHostGame}
        onCreateNewRoom={() => createNewHostRoom(15)}
        onExitHost={() => {
          closeHostSession();
          setMode('choose_mode');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // ROUTE 2: Mobile Player View (Personal handheld controller)
  // -------------------------------------------------------------
  if (mode === 'player') {
    // If currently reconnecting to a known session, display sleek Reconnection Screen
    if (
      (isReconnecting || (storedPlayerSession && !publicState)) &&
      (sessionId || storedPlayerSession?.sessionId)
    ) {
      return (
        <MobileReconnectingScreen
          sessionId={sessionId || storedPlayerSession?.sessionId || ''}
          playerName={storedPlayerSession?.playerName || 'Player'}
          avatar={storedPlayerSession?.avatar || '👑'}
          errorMessage={errorMessage}
          onCancel={() => {
            leaveSession();
            setMode('choose_mode');
          }}
          onManualRetry={reconnectManual}
        />
      );
    }

    // If not connected to a session yet, show Mobile Join Screen
    if (!myPlayerId || !publicState || myPlayerIndex === null) {
      return (
        <MobileJoinScreen
          initialSessionId={sessionParam || sessionId || ''}
          onJoin={(sCode, name, avatar) => {
            joinSession(sCode, name, avatar);
          }}
          onSwitchToHost={() => setMode('host')}
        />
      );
    }

    // If game has not started yet, show Mobile Lobby Waiting screen
    if (publicState.status === 'lobby') {
      const myPlayer = publicState.players[myPlayerIndex];
      return (
        <MobileLobbyWaiting
          sessionId={publicState.sessionId}
          myPlayerName={myPlayer?.name || 'Player'}
          myAvatar={myPlayer?.avatar || '👑'}
          myPlayerIndex={myPlayerIndex}
          lobbyPlayers={
            lobbyPlayers.length > 0
              ? lobbyPlayers
              : publicState.players.map((p, idx) => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar,
                  isAI: p.isAI,
                  connected: p.connected,
                  playerIndex: idx,
                }))
          }
          onLeave={() => {
            leaveSession();
            setMode('choose_mode');
          }}
        />
      );
    }

    // Handheld focused player interface during active match
    return (
      <MobilePlayerView
        publicState={publicState}
        privateState={privateState}
        myPlayerId={myPlayerId}
        myPlayerIndex={myPlayerIndex}
        onSendAction={sendGameAction}
        errorMessage={errorMessage}
        isConnected={isConnected}
        onLeaveGame={() => {
          leaveSession();
          setMode('choose_mode');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // ROUTE 3: Initial Mode Chooser (Welcome Screen)
  // -------------------------------------------------------------
  if (mode === 'choose_mode') {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
        {/* Soft background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-[#121826] border border-white/8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] mb-4">
            <Crown size={32} className="stroke-[2.5]" />
          </div>

          <h1 className="font-['Cinzel'] font-black text-2xl sm:text-3xl text-amber-200 tracking-wider">
            SPLENDOR
          </h1>
          <p className="font-['Cinzel'] font-bold text-xs sm:text-sm text-amber-400/90 tracking-widest uppercase mt-0.5 mb-6">
            Renaissance Gem Masters • Multiplayer Experience
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-8">
            Experience authentic tabletop Splendor where one screen acts as the dedicated Host board, and all players connect via mobile phones.
          </p>

          {/* 3 Main Mode Selection Tiles */}
          <div className="flex flex-col gap-3.5 w-full">
            {/* 1. Host Mode (Featured Primary Option) */}
            <button
              type="button"
              onClick={() => {
                setMode('host');
                createHostSession(15);
              }}
              className="w-full p-4 rounded-2xl bg-[#0B0F1A] hover:bg-[#0B0F1A]/80 border border-amber-500/40 hover:border-amber-400 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow">
                <Tv size={24} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-black text-base text-amber-200 group-hover:text-amber-100 flex items-center gap-2">
                  <span>START HOST TABLE VIEW</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                    TV / Table
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Creates room & displays large QR code for mobile phones to scan and join.
                </div>
              </div>
            </button>

            {/* 2. Join as Mobile Player */}
            <button
              type="button"
              onClick={() => setMode('player')}
              className="w-full p-4 rounded-2xl bg-[#0B0F1A] hover:bg-white/5 border border-white/8 hover:border-amber-400/50 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-white/10">
                <Smartphone size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-black text-base text-slate-200 group-hover:text-amber-200">
                  JOIN ON MOBILE
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Enter 6-letter room code or join directly via scanned QR code.
                </div>
              </div>
            </button>

            {/* 3. Solo Practice vs AI */}
            <button
              type="button"
              onClick={() => setMode('solo')}
              className="w-full p-3.5 rounded-2xl bg-[#0B0F1A]/60 hover:bg-white/5 border border-white/5 hover:border-white/15 flex items-center gap-4 transition-all cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0 border border-white/5">
                <Users size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cinzel'] font-bold text-sm text-slate-300 group-hover:text-amber-200">
                  Solo Practice vs AI
                </div>
                <div className="text-xs text-slate-500">
                  Single-device mode against computer opponents.
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <SoloTableView onExitSolo={() => setMode('choose_mode')} />;
}
