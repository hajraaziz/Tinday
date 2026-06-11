import express from "express";
import { z } from "zod";
import * as messagingController from "./messaging.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

const muteSchema = z.object({ muted: z.boolean() });
const hiddenSchema = z.object({ hidden: z.boolean() });

router.use(authenticate);

// Inbox
router.get("/inbox", messagingController.getInbox);

// Match messages
router.get("/matches/:matchId/messages", messagingController.getMessages);
router.post(
  "/matches/:matchId/messages",
  validate(sendMessageSchema),
  messagingController.sendMessage,
);

// Explicitly mark a conversation read from the inbox ⋯ menu (no body).
router.post("/matches/:matchId/read", messagingController.markRead);

// Per-user inbox state: mute and soft-delete (hide). Idempotent PUTs carry the
// desired state so concurrent devices converge instead of racing a toggle.
router.put(
  "/matches/:matchId/mute",
  validate(muteSchema),
  messagingController.setMute,
);
router.put(
  "/matches/:matchId/hidden",
  validate(hiddenSchema),
  messagingController.setHidden,
);

export default router;
