import express from "express";
import { z } from "zod";
import * as messagingController from "./messaging.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

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

export default router;
