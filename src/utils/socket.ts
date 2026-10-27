import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinSessionRoom(sessionCode: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-room', sessionCode.toUpperCase().trim());
  } else {
    s.once('connect', () => {
      s.emit('join-room', sessionCode.toUpperCase().trim());
    });
  }
}

export function leaveSessionRoom(sessionCode: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave-room', sessionCode.toUpperCase().trim());
  }
}
