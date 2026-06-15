import { Server } from "socket.io";
import { supabase } from "./supabase.js";
import { verifyMatchMembership } from "../modules/messaging/messaging.service.js";

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
    },
  });

  // Middleware for JWT verification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    socket.on("join_match", async (matchId) => {
      try {
        // Verify match membership
        await verifyMatchMembership(matchId, socket.user.id);

        socket.join(matchId);
        console.log(`User ${socket.user.id} joined room: ${matchId}`);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("typing_start", (matchId) => {
      socket.to(matchId).emit("user_typing", {
        matchId,
        userId: socket.user.id,
      });
    });

    socket.on("typing_stop", (matchId) => {
      socket.to(matchId).emit("user_stopped_typing", {
        matchId,
        userId: socket.user.id,
      });
    });

    socket.on("disconnecting", () => {
      // Notify rooms that user is going offline
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("user_offline", {
            userId: socket.user.id,
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};
