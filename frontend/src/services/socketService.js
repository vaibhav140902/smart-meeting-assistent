// Purpose: Socket.io client
import { io } from 'socket.io-client';
import * as localStorage from '../utils/localStorage';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;
  
  const token = localStorage.getAccessToken();
  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  if (!socket) return connectSocket();
  return socket;
};