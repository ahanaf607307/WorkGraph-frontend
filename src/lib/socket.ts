import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "../config";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const token = typeof window !== "undefined" ? localStorage.getItem(APP_CONFIG.tokenKey) : null;

    socketInstance = io(APP_CONFIG.socketUrl, {
      auth: { token },
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 5,
    });
  }

  return socketInstance;
};

export const connectSocketWithToken = (token: string) => {
  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(APP_CONFIG.socketUrl, {
    auth: { token },
    autoConnect: true,
    withCredentials: true,
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
