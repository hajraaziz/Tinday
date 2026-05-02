import "express-async-errors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

import { setupSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./modules/auth/auth.routes.js";
import profilesRoutes from "./modules/profiles/profiles.routes.js";
import swipesRoutes from "./modules/swipes/swipes.routes.js";
import matchesRoutes from "./modules/matches/matches.routes.js";
import exploreRoutes from "./modules/explore/explore.routes.js";
import messagingRoutes from "./modules/messaging/messaging.routes.js";
import aiProxyRoutes from "./modules/ai-proxy/ai-proxy.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
setupSocket(httpServer);

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

// Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: "Too many login/register attempts, please try again later.",
  },
});

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(globalLimiter);

app.use(
  "/api/profiles/me/photo",
  express.raw({ type: "image/*", limit: "5mb" }),
);
app.use(
  "/api/profiles/me/projects/media",
  express.raw({ type: "image/*", limit: "5mb" }),
);
app.use(express.json());

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/swipes", swipesRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/ai", aiProxyRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), service: "express" });
});

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
