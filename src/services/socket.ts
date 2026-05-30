import { io, Socket } from 'socket.io-client';
import { getUser } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Auto-join theatre room when connected
    socket.on('connect', () => {
      const user = getUser();
      if (user?.theatreId) {
        socket!.emit('join_theatre', user.theatreId);
      }
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
