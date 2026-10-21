import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { sessionManager } from './src/server/sessionManager.ts';
import { ClientMessage } from './src/types/multiplayer.ts';

// ES Module __dirname and __filename resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port configuration (Cloud Run provides PORT environment variable)
const PORT = process.env.PORT || 3000;

export function getLocalNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (name.toLowerCase().includes('vmware') || name.toLowerCase().includes('vethernet') || name.toLowerCase().includes('virtual')) {
      continue;
    }
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

export function getNetworkUrls(sessionId: string, req: any) {
  const forwardedHost = (req?.headers?.['x-forwarded-host'] as string) || '';
  const host = forwardedHost || (req?.headers?.host as string) || '';
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'https';

  const lanIp = getLocalNetworkIp();
  const lanJoinUrl = lanIp !== 'localhost'
    ? `http://${lanIp}:${PORT}/?session=${sessionId}&role=player`
    : `http://localhost:${PORT}/?session=${sessionId}&role=player`;

  // Determine Internet / Any Network URL:
  let internetJoinUrl = '';
  if (process.env.PUBLIC_URL) {
    const cleanPublic = process.env.PUBLIC_URL.replace(/\/+$/, '');
    internetJoinUrl = `${cleanPublic}/?session=${sessionId}&role=player`;
  } else if (host.includes('run.app') || host.includes('aistudio')) {
    const publicHost = host.replace(/^ais-dev-/, 'ais-pre-');
    internetJoinUrl = `https://${publicHost}/?session=${sessionId}&role=player`;
  } else if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1') && !host.startsWith('172.') && !host.startsWith('10.')) {
    internetJoinUrl = `${proto}://${host}/?session=${sessionId}&role=player`;
  } else {
    // Default public cloud URL accessible from any mobile cellular / external network
    internetJoinUrl = `https://ais-pre-uxxuhyirj6wwedrsnxj43u-748355567623.asia-east1.run.app/?session=${sessionId}&role=player`;
  }

  // Default join URL: prefer internet URL so people on different networks / cellular data can join seamlessly
  const joinUrl = internetJoinUrl || lanJoinUrl;

  return { joinUrl, internetJoinUrl, lanJoinUrl };
}

const app = express();
const server = http.createServer(app);

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now() });
});

// API endpoint to inspect session details
app.get('/api/sessions/:id', (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const publicState = sessionManager.getPublicState(session.sessionId);
  res.json({
    sessionId: session.sessionId,
    status: session.status,
    playerCount: session.players.length,
    publicState,
  });
});

// REST Fallback: Join Session from phone or external network via HTTP
app.post('/api/sessions/:id/join', (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { playerName, avatar, playerId } = req.body;
  const mockWs = {
    readyState: WebSocket.OPEN,
    send: () => {},
  } as any;

  const result = sessionManager.addPlayer(session.sessionId, playerName, avatar, mockWs, playerId);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  const publicState = sessionManager.getPublicState(session.sessionId);
  const privateState = sessionManager.getPrivateState(session.sessionId, result.player.id);
  sessionManager.broadcastLobbyUpdate(session.sessionId);

  res.json({
    sessionId: session.sessionId,
    playerId: result.player.id,
    playerIndex: result.player.playerIndex,
    publicState,
    privateState,
  });
});

// REST Fallback: Send Player Action via HTTP
app.post('/api/sessions/:id/action', (req, res) => {
  const { playerId, action } = req.body;
  const result = sessionManager.handlePlayerAction(req.params.id, playerId, action);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  sessionManager.broadcastToSession(req.params.id);
  const publicState = sessionManager.getPublicState(req.params.id);
  const privateState = sessionManager.getPrivateState(req.params.id, playerId);
  res.json({ success: true, publicState, privateState });
});

// REST Fallback: Poll session state via HTTP
app.get('/api/sessions/:id/state', (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const playerId = req.query.playerId as string;
  const publicState = sessionManager.getPublicState(session.sessionId);
  const privateState = playerId ? sessionManager.getPrivateState(session.sessionId, playerId) : null;
  res.json({ publicState, privateState });
});

// WebSocket Server attached directly to HTTP server on /ws
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket, req) => {
  let boundSessionId: string | null = null;
  let boundPlayerId: string | null = null;
  let isHost = false;

  ws.on('message', (rawData: string) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());

      switch (data.type) {
        case 'host_create_session': {
          const session = sessionManager.createSession(ws, data.targetVP || 15);
          boundSessionId = session.sessionId;
          isHost = true;

          const { joinUrl, internetJoinUrl, lanJoinUrl } = getNetworkUrls(session.sessionId, req);

          ws.send(
            JSON.stringify({
              type: 'session_created',
              sessionId: session.sessionId,
              joinUrl,
              internetJoinUrl,
              lanJoinUrl,
            })
          );
          sessionManager.broadcastLobbyUpdate(session.sessionId);
          break;
        }

        case 'host_reconnect': {
          if (!data.sessionId) return;
          const session = sessionManager.getSession(data.sessionId);
          if (session) {
            sessionManager.setHostSocket(session.sessionId, ws);
            boundSessionId = session.sessionId;

            const { joinUrl, internetJoinUrl, lanJoinUrl } = getNetworkUrls(session.sessionId, req);

            ws.send(
              JSON.stringify({
                type: 'session_created',
                sessionId: session.sessionId,
                joinUrl,
                internetJoinUrl,
                lanJoinUrl,
              })
            );

            const publicState = sessionManager.getPublicState(session.sessionId);
            if (session.status === 'lobby') {
              sessionManager.broadcastLobbyUpdate(session.sessionId);
            } else if (publicState) {
              ws.send(JSON.stringify({ type: 'game_state_sync', publicState }));
            }
          }
          break;
        }

        case 'host_close_session': {
          if (!data.sessionId) return;
          sessionManager.closeSession(data.sessionId);
          if (boundSessionId === data.sessionId.toUpperCase()) {
            boundSessionId = null;
          }
          break;
        }

        case 'player_leave_session': {
          if (data.sessionId && data.playerId) {
            sessionManager.removePlayer(data.sessionId, data.playerId, true);
            const session = sessionManager.getSession(data.sessionId);
            if (session?.status === 'playing' || session?.status === 'final_round') {
              sessionManager.broadcastToSession(data.sessionId);
            } else {
              sessionManager.broadcastLobbyUpdate(data.sessionId);
            }
          }
          break;
        }

        case 'player_join_session': {
          const result = sessionManager.addPlayer(
            data.sessionId,
            data.playerName,
            data.avatar,
            ws,
            data.playerId
          );

          if ('error' in result) {
            ws.send(JSON.stringify({ type: 'action_error', message: result.error }));
            return;
          }

          boundSessionId = data.sessionId.toUpperCase();
          boundPlayerId = result.player.id;

          const publicState = sessionManager.getPublicState(boundSessionId);
          const privateState = sessionManager.getPrivateState(boundSessionId, boundPlayerId);

          ws.send(
            JSON.stringify({
              type: 'player_join_success',
              sessionId: boundSessionId,
              playerId: result.player.id,
              playerIndex: result.player.playerIndex,
              publicState,
              privateState,
            })
          );

          const session = sessionManager.getSession(boundSessionId);
          if (session?.status === 'playing' || session?.status === 'final_round') {
            sessionManager.broadcastToSession(boundSessionId);
          } else {
            sessionManager.broadcastLobbyUpdate(boundSessionId);
          }
          break;
        }

        case 'host_add_ai': {
          if (!data.sessionId) return;
          const result = sessionManager.addAI(data.sessionId, data.difficulty || 'medium');
          if ('error' in result) {
            ws.send(JSON.stringify({ type: 'action_error', message: result.error }));
          } else {
            sessionManager.broadcastLobbyUpdate(data.sessionId);
          }
          break;
        }

        case 'host_start_game': {
          if (!data.sessionId) return;
          const result = sessionManager.startGame(data.sessionId);
          if (!result.success) {
            ws.send(JSON.stringify({ type: 'action_error', message: result.error || 'Failed to start game.' }));
          } else {
            sessionManager.broadcastToSession(data.sessionId);
          }
          break;
        }

        case 'host_restart_game': {
          if (!data.sessionId) return;
          const session = sessionManager.getSession(data.sessionId);
          if (session) {
            sessionManager.startGame(data.sessionId);
            sessionManager.broadcastToSession(data.sessionId);
          }
          break;
        }

        case 'game_action': {
          const result = sessionManager.handlePlayerAction(
            data.sessionId,
            data.playerId,
            data.action
          );

          if (!result.success) {
            ws.send(JSON.stringify({ type: 'action_error', message: result.error }));
          } else {
            sessionManager.broadcastToSession(data.sessionId);
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: err?.message || 'Invalid message payload' }));
    }
  });

  ws.on('close', () => {
    if (boundSessionId && boundPlayerId) {
      sessionManager.removePlayer(boundSessionId, boundPlayerId);
      const session = sessionManager.getSession(boundSessionId);
      if (session?.status === 'playing' || session?.status === 'final_round') {
        sessionManager.broadcastToSession(boundSessionId);
      } else {
        sessionManager.broadcastLobbyUpdate(boundSessionId);
      }
    }
  });
});

// Dev vs Prod Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    const lanIp = getLocalNetworkIp();
    console.log(`Splendor Multiplayer Server running:`);
    console.log(`  > Local:   http://localhost:${PORT}`);
    console.log(`  > Network: http://${lanIp}:${PORT}`);
  });
}

startServer();
