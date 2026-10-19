import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { sessionManager } from './src/server/sessionManager.ts';
import { ClientMessage } from './src/types/multiplayer.ts';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

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

          const hostHeader = req.headers.host || `localhost:${PORT}`;
          const proto = req.headers['x-forwarded-proto'] || 'http';
          const joinUrl = `${proto}://${hostHeader}/?session=${session.sessionId}&role=player`;

          ws.send(
            JSON.stringify({
              type: 'session_created',
              sessionId: session.sessionId,
              joinUrl,
            })
          );
          sessionManager.broadcastLobbyUpdate(session.sessionId);
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
    console.log(`Splendor Multiplayer Server running on port ${PORT}`);
  });
}

startServer();
