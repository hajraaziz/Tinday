import express from "express";
import { z } from "zod";
import * as messagingController from "./messaging.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

// A message must carry text, an attachment, or both. content is optional so an
// attachment can be sent with no caption.
const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    attachment_url: z.string().url().optional(),
    attachment_type: z.string().optional(),
    attachment_name: z.string().optional(),
  })
  .refine((d) => d.content || d.attachment_url, {
    message: "Message must have text or an attachment",
  });

// MIME types accepted as message attachments: images, PDFs, and common office
// documents. A type outside this list makes express.raw skip parsing, leaving an
// empty body — the controller turns that into a 415.
const ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
];

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

// Attachment upload — raw binary (not FormData), mirroring the profile photo
// upload. The original filename rides in the X-File-Name header since raw
// binary drops it. Returns { url, type, name }; the client then sends a message
// referencing the URL.
router.post(
  "/matches/:matchId/attachments",
  express.raw({ type: ATTACHMENT_MIME_TYPES, limit: "10mb" }),
  messagingController.uploadAttachment,
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
