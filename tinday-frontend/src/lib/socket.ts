/* eslint-disable @typescript-eslint/no-require-imports */
import { io, Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
if (!socketUrl) {
  throw new Error("Missing NEXT_PUBLIC_SOCKET_URL environment variable");
}

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      auth: (cb: (data: { token: string | null }) => void) => {
        const { useAuthStore } =
          require("@/store/authStore") as typeof import("@/store/authStore");
        const { access_token } = useAuthStore.getState();
        cb({ token: access_token });
      },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export { getSocket };
