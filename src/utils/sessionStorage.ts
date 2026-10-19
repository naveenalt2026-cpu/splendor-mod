export interface StoredPlayerSession {
  sessionId: string;
  playerId: string;
  playerIndex: number;
  playerName: string;
  avatar: string;
  role: 'player';
  savedAt: number;
}

export interface StoredHostSession {
  sessionId: string;
  savedAt: number;
}

const PLAYER_SESSION_KEY = 'splendor_player_session';
const HOST_SESSION_KEY = 'splendor_host_session';
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function savePlayerSession(session: {
  sessionId: string;
  playerId: string;
  playerIndex: number;
  playerName: string;
  avatar: string;
}): void {
  try {
    const data: StoredPlayerSession = {
      ...session,
      role: 'player',
      savedAt: Date.now(),
    };
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save player session to localStorage', e);
  }
}

export function getStoredPlayerSession(): StoredPlayerSession | null {
  try {
    const raw = localStorage.getItem(PLAYER_SESSION_KEY);
    if (!raw) return null;
    const data: StoredPlayerSession = JSON.parse(raw);
    if (!data.sessionId || !data.playerId) return null;
    if (Date.now() - data.savedAt > MAX_SESSION_AGE_MS) {
      clearPlayerSession();
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

export function clearPlayerSession(): void {
  try {
    localStorage.removeItem(PLAYER_SESSION_KEY);
  } catch (e) {
    // Ignore error
  }
}

export function saveHostSession(sessionId: string): void {
  try {
    const data: StoredHostSession = {
      sessionId,
      savedAt: Date.now(),
    };
    localStorage.setItem(HOST_SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save host session to localStorage', e);
  }
}

export function getStoredHostSession(): StoredHostSession | null {
  try {
    const raw = localStorage.getItem(HOST_SESSION_KEY);
    if (!raw) return null;
    const data: StoredHostSession = JSON.parse(raw);
    if (!data.sessionId) return null;
    if (Date.now() - data.savedAt > MAX_SESSION_AGE_MS) {
      clearHostSession();
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

export function clearHostSession(): void {
  try {
    localStorage.removeItem(HOST_SESSION_KEY);
  } catch (e) {
    // Ignore error
  }
}
