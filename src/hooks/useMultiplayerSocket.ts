import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ClientGameAction,
  ClientMessage,
  PrivatePlayerState,
  PublicGameState,
  ServerMessage,
  SessionPlayer,
} from '../types/multiplayer.ts';
import {
  clearHostSession,
  clearPlayerSession,
  getStoredHostSession,
  getStoredPlayerSession,
  saveHostSession,
  savePlayerSession,
  StoredPlayerSession,
} from '../utils/sessionStorage.ts';

export function useMultiplayerSocket() {
  // Determine initial state from URL params and localStorage
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlSession = urlParams?.get('session')?.toUpperCase().trim() || null;
  const initialStored = getStoredPlayerSession();
  const initialHostStored = getStoredHostSession();

  // If URL has a different session than stored, user is joining a different room
  const validStoredPlayer: StoredPlayerSession | null =
    initialStored && (!urlSession || initialStored.sessionId.toUpperCase() === urlSession)
      ? initialStored
      : null;

  if (initialStored && urlSession && initialStored.sessionId.toUpperCase() !== urlSession) {
    clearPlayerSession();
  }

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(
    Boolean(validStoredPlayer?.sessionId && validStoredPlayer?.playerId)
  );
  const [sessionId, setSessionId] = useState<string | null>(
    validStoredPlayer?.sessionId || urlSession || initialHostStored?.sessionId || null
  );
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [internetJoinUrl, setInternetJoinUrl] = useState<string | null>(null);
  const [lanJoinUrl, setLanJoinUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(Boolean(initialHostStored?.sessionId && !validStoredPlayer));
  const [myPlayerId, setMyPlayerId] = useState<string | null>(validStoredPlayer?.playerId || null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(
    validStoredPlayer ? validStoredPlayer.playerIndex : null
  );
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<SessionPlayer[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Active session credentials ref for socket event handlers without stale closures
  const activeSessionRef = useRef<{
    sessionId: string | null;
    playerId: string | null;
    playerName: string | null;
    avatar: string | null;
    isHost: boolean;
  }>({
    sessionId: validStoredPlayer?.sessionId || urlSession || initialHostStored?.sessionId || null,
    playerId: validStoredPlayer?.playerId || null,
    playerName: validStoredPlayer?.playerName || null,
    avatar: validStoredPlayer?.avatar || null,
    isHost: Boolean(initialHostStored?.sessionId && !validStoredPlayer),
  });

  // Initialize or get WebSocket connection
  const getSocket = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return socketRef.current;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setErrorMessage(null);

      const cur = activeSessionRef.current;
      // Auto re-authenticate host
      if (cur.isHost && cur.sessionId) {
        ws.send(
          JSON.stringify({
            type: 'host_reconnect',
            sessionId: cur.sessionId,
          })
        );
      } else if (cur.sessionId && cur.playerId && cur.playerName) {
        // Auto re-authenticate mobile player
        setIsReconnecting(true);
        ws.send(
          JSON.stringify({
            type: 'player_join_session',
            sessionId: cur.sessionId,
            playerName: cur.playerName,
            avatar: cur.avatar || '👑',
            playerId: cur.playerId,
          })
        );
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnect if session was active
      if (activeSessionRef.current.sessionId) {
        setIsReconnecting(true);
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          getSocket();
        }, 1500);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'session_created':
            setSessionId(msg.sessionId);
            setJoinUrl(msg.joinUrl);
            if (msg.internetJoinUrl) setInternetJoinUrl(msg.internetJoinUrl);
            if (msg.lanJoinUrl) setLanJoinUrl(msg.lanJoinUrl);
            setIsHost(true);
            setIsReconnecting(false);
            activeSessionRef.current.isHost = true;
            activeSessionRef.current.sessionId = msg.sessionId;
            saveHostSession(msg.sessionId);
            break;

          case 'session_closed':
            clearPlayerSession();
            clearHostSession();
            setSessionId(null);
            setMyPlayerId(null);
            setMyPlayerIndex(null);
            setPublicState(null);
            setPrivateState(null);
            setLobbyPlayers([]);
            setIsReconnecting(false);
            setErrorMessage(msg.message || 'The host has closed this room.');
            activeSessionRef.current = {
              sessionId: null,
              playerId: null,
              playerName: null,
              avatar: null,
              isHost: false,
            };
            break;

          case 'player_join_success': {
            setSessionId(msg.sessionId);
            setMyPlayerId(msg.playerId);
            setMyPlayerIndex(msg.playerIndex);
            setPublicState(msg.publicState);
            setPrivateState(msg.privateState);
            setIsReconnecting(false);

            const myPlayer =
              msg.publicState.players[msg.playerIndex] ||
              msg.publicState.players.find((p) => p.id === msg.playerId);
            const pName = myPlayer?.name || activeSessionRef.current.playerName || 'Player';
            const pAvatar = myPlayer?.avatar || activeSessionRef.current.avatar || '👑';

            activeSessionRef.current = {
              sessionId: msg.sessionId,
              playerId: msg.playerId,
              playerName: pName,
              avatar: pAvatar,
              isHost: false,
            };

            savePlayerSession({
              sessionId: msg.sessionId,
              playerId: msg.playerId,
              playerIndex: msg.playerIndex,
              playerName: pName,
              avatar: pAvatar,
            });
            break;
          }

          case 'session_lobby_update':
            setSessionId(msg.sessionId);
            setLobbyPlayers(msg.players);
            setCanStart(msg.canStart);
            setIsReconnecting(false);
            break;

          case 'game_state_sync':
            setPublicState(msg.publicState);
            if (msg.privateState) {
              setPrivateState(msg.privateState);
            }
            setIsReconnecting(false);
            break;

          case 'action_error':
          case 'error': {
            setErrorMessage(msg.message);
            // If session expired or player could not be reconnected
            if (
              msg.message.includes('Session not found') ||
              msg.message.includes('Game is already in progress and all slots are occupied') ||
              msg.message.includes('Session is full')
            ) {
              clearPlayerSession();
              clearHostSession();
              setIsReconnecting(false);
              setMyPlayerId(null);
              setMyPlayerIndex(null);
              setPublicState(null);
              setPrivateState(null);
              activeSessionRef.current = {
                sessionId: activeSessionRef.current.sessionId,
                playerId: null,
                playerName: null,
                avatar: null,
                isHost: false,
              };
            }
            setTimeout(() => setErrorMessage(null), 4000);
            break;
          }

          case 'pong':
            break;
        }
      } catch (e) {
        console.error('Failed to parse socket message', e);
      }
    };

    socketRef.current = ws;
    return ws;
  }, []);

  // Connect on mount if session exists
  useEffect(() => {
    if (activeSessionRef.current.sessionId) {
      getSocket();
    }
  }, [getSocket]);

  // Keep-alive ping every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Auto-reconnect immediately on visibility change (mobile screen unlock / tab foreground)
  useEffect(() => {
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        const ws = socketRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          getSocket();
        } else if (ws.readyState === WebSocket.OPEN) {
          const cur = activeSessionRef.current;
          if (cur.sessionId && cur.playerId && cur.playerName) {
            // Re-sync player session immediately
            ws.send(
              JSON.stringify({
                type: 'player_join_session',
                sessionId: cur.sessionId,
                playerName: cur.playerName,
                avatar: cur.avatar || '👑',
                playerId: cur.playerId,
              })
            );
          } else {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('pageshow', handleWake);
    window.addEventListener('focus', handleWake);

    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('pageshow', handleWake);
      window.removeEventListener('focus', handleWake);
    };
  }, [getSocket]);

  const sendMessage = useCallback(
    (msg: ClientMessage) => {
      const ws = getSocket();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        ws.addEventListener(
          'open',
          () => {
            ws.send(JSON.stringify(msg));
          },
          { once: true }
        );
      }
    },
    [getSocket]
  );

  const createHostSession = useCallback(
    (targetVP = 15) => {
      activeSessionRef.current.isHost = true;
      sendMessage({ type: 'host_create_session', targetVP });
    },
    [sendMessage]
  );

  const joinSession = useCallback(
    (sessionCode: string, name: string, avatar: string) => {
      const formattedCode = sessionCode.toUpperCase().trim();
      const existingId =
        activeSessionRef.current.sessionId === formattedCode
          ? activeSessionRef.current.playerId || undefined
          : undefined;

      activeSessionRef.current = {
        sessionId: formattedCode,
        playerId: existingId || null,
        playerName: name,
        avatar,
        isHost: false,
      };

      setSessionId(formattedCode);
      setIsReconnecting(Boolean(existingId));

      sendMessage({
        type: 'player_join_session',
        sessionId: formattedCode,
        playerName: name,
        avatar,
        playerId: existingId,
      });
    },
    [sendMessage]
  );

  const leaveSession = useCallback(() => {
    const cur = activeSessionRef.current;
    if (cur.sessionId && cur.playerId) {
      sendMessage({
        type: 'player_leave_session',
        sessionId: cur.sessionId,
        playerId: cur.playerId,
      });
    }
    clearPlayerSession();
    clearHostSession();
    setSessionId(null);
    setMyPlayerId(null);
    setMyPlayerIndex(null);
    setPublicState(null);
    setPrivateState(null);
    setLobbyPlayers([]);
    setIsReconnecting(false);
    setIsHost(false);
    activeSessionRef.current = {
      sessionId: null,
      playerId: null,
      playerName: null,
      avatar: null,
      isHost: false,
    };
  }, [sendMessage]);

  const reconnectManual = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }
    getSocket();
  }, [getSocket]);

  const addAIPlayer = useCallback(
    (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
      if (!sessionId) return;
      sendMessage({
        type: 'host_add_ai',
        sessionId,
        difficulty,
      });
    },
    [sendMessage, sessionId]
  );

  const startHostGame = useCallback(() => {
    if (!sessionId) return;
    sendMessage({
      type: 'host_start_game',
      sessionId,
    });
  }, [sendMessage, sessionId]);

  const restartHostGame = useCallback(() => {
    if (!sessionId) return;
    sendMessage({
      type: 'host_restart_game',
      sessionId,
    });
  }, [sendMessage, sessionId]);

  const closeHostSession = useCallback(() => {
    const cur = activeSessionRef.current;
    if (cur.sessionId) {
      sendMessage({
        type: 'host_close_session',
        sessionId: cur.sessionId,
      });
    }
    clearHostSession();
    setSessionId(null);
    setPublicState(null);
    setPrivateState(null);
    setLobbyPlayers([]);
    setIsHost(false);
    activeSessionRef.current = {
      sessionId: null,
      playerId: null,
      playerName: null,
      avatar: null,
      isHost: false,
    };
  }, [sendMessage]);

  const createNewHostRoom = useCallback(
    (targetVP = 15) => {
      const cur = activeSessionRef.current;
      if (cur.sessionId) {
        sendMessage({
          type: 'host_close_session',
          sessionId: cur.sessionId,
        });
      }
      clearHostSession();
      setSessionId(null);
      setPublicState(null);
      setPrivateState(null);
      setLobbyPlayers([]);
      activeSessionRef.current = {
        sessionId: null,
        playerId: null,
        playerName: null,
        avatar: null,
        isHost: true,
      };
      sendMessage({
        type: 'host_create_session',
        targetVP,
      });
    },
    [sendMessage]
  );

  const sendGameAction = useCallback(
    (action: ClientGameAction) => {
      if (!sessionId || !myPlayerId) return;
      sendMessage({
        type: 'game_action',
        sessionId,
        playerId: myPlayerId,
        action,
      });
    },
    [sendMessage, sessionId, myPlayerId]
  );

  return {
    isConnected,
    isReconnecting,
    sessionId,
    joinUrl,
    internetJoinUrl,
    lanJoinUrl,
    isHost,
    myPlayerId,
    myPlayerIndex,
    publicState,
    privateState,
    lobbyPlayers,
    canStart,
    errorMessage,
    storedPlayerSession: validStoredPlayer,
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
  };
}
