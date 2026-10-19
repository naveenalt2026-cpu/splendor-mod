import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ClientGameAction,
  ClientMessage,
  PrivatePlayerState,
  PublicGameState,
  ServerMessage,
  SessionPlayer,
} from '../types/multiplayer.ts';

export function useMultiplayerSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<SessionPlayer[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Initialize or get WebSocket connection
  const getSocket = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return socketRef.current;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setErrorMessage(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnect if session is active
      if (sessionId) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          getSocket();
        }, 2000);
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
            setIsHost(true);
            break;

          case 'player_join_success':
            setSessionId(msg.sessionId);
            setMyPlayerId(msg.playerId);
            setMyPlayerIndex(msg.playerIndex);
            setPublicState(msg.publicState);
            setPrivateState(msg.privateState);
            break;

          case 'session_lobby_update':
            setSessionId(msg.sessionId);
            setLobbyPlayers(msg.players);
            setCanStart(msg.canStart);
            break;

          case 'game_state_sync':
            setPublicState(msg.publicState);
            if (msg.privateState) {
              setPrivateState(msg.privateState);
            }
            break;

          case 'action_error':
          case 'error':
            setErrorMessage(msg.message);
            setTimeout(() => setErrorMessage(null), 4000);
            break;

          case 'pong':
            break;
        }
      } catch (e) {
        console.error('Failed to parse socket message', e);
      }
    };

    socketRef.current = ws;
    return ws;
  }, [sessionId]);

  // Keep-alive ping every 25s
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback((msg: ClientMessage) => {
    const ws = getSocket();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify(msg));
      }, { once: true });
    }
  }, [getSocket]);

  const createHostSession = useCallback((targetVP = 15) => {
    sendMessage({ type: 'host_create_session', targetVP });
  }, [sendMessage]);

  const joinSession = useCallback((sessionCode: string, name: string, avatar: string) => {
    const storedId = myPlayerId || undefined;
    sendMessage({
      type: 'player_join_session',
      sessionId: sessionCode.toUpperCase().trim(),
      playerName: name,
      avatar,
      playerId: storedId,
    });
  }, [sendMessage, myPlayerId]);

  const addAIPlayer = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!sessionId) return;
    sendMessage({
      type: 'host_add_ai',
      sessionId,
      difficulty,
    });
  }, [sendMessage, sessionId]);

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

  const sendGameAction = useCallback((action: ClientGameAction) => {
    if (!sessionId || !myPlayerId) return;
    sendMessage({
      type: 'game_action',
      sessionId,
      playerId: myPlayerId,
      action,
    });
  }, [sendMessage, sessionId, myPlayerId]);

  return {
    isConnected,
    sessionId,
    joinUrl,
    isHost,
    myPlayerId,
    myPlayerIndex,
    publicState,
    privateState,
    lobbyPlayers,
    canStart,
    errorMessage,
    createHostSession,
    joinSession,
    addAIPlayer,
    startHostGame,
    restartHostGame,
    sendGameAction,
  };
}
