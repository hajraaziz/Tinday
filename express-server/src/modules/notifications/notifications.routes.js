import express from "express";
import { z } from "zod";
import * as notificationsController from "./notifications.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = express.Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

router.use(authenticate);

router.get("/", notificationsController.list);
router.get("/unread-count", notificationsController.unreadCount);
router.get("/stream", notificationsController.stream);
router.post("/read-all", notificationsController.markAllRead);
router.post("/:id/read", notificationsController.markRead);
router.delete("/:id", notificationsController.remove);
router.post(
  "/push/subscribe",
  validate(subscribeSchema),
  notificationsController.subscribePush,
);
router.post(
  "/push/unsubscribe",
  validate(unsubscribeSchema),
  notificationsController.unsubscribePush,
);

export default router;
