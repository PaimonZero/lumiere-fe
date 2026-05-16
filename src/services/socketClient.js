/**
 * Lumiere AI — Socket.IO Client
 * Connects to the backend Socket.IO server for real-time progress.
 */
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

let socket = null;
const joinedSessions = new Set();

/**
 * Get or create the singleton Socket.IO client.
 */
export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      joinedSessions.forEach((sessionId) => {
        socket.emit('join_session', { session_id: sessionId });
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
    });
  }
  return socket;
}

/**
 * Join a session room for receiving progress events.
 * @param {string} sessionId
 */
export function joinSession(sessionId) {
  if (!sessionId) return;
  joinedSessions.add(sessionId);
  const s = getSocket();
  s.emit('join_session', { session_id: sessionId });
}

/**
 * Disconnect and cleanup.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
