import express from "express";
import { z } from "zod";
import * as aiProxyController from "./ai-proxy.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

const chatSchema = z.object({
  message: z.string().min(1),
  conversation_history: z
    .array(
      z.object({
        role: z.enum(["user", "model", "system"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

const shareProfileSchema = z.object({
  profile_id: z.string().uuid(),
});

const validateTagSchema = z.object({
  value: z.string().min(1),
  kind: z.enum(["skill", "role"]),
});

router.use(authenticate);

router.get("/recommend", aiProxyController.recommend);
router.post("/chat", validate(chatSchema), aiProxyController.chat);
router.post(
  "/share-profile",
  validate(shareProfileSchema),
  aiProxyController.shareProfile
);
router.post(
  "/validate-tag",
  validate(validateTagSchema),
  aiProxyController.validateTag
);

export default router;
