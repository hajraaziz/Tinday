import express from "express";
import { z } from "zod";
import * as profilesController from "./profiles.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  about: z.string().optional(),
  location: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  skills: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  projects: z.array(z.any()).optional(),
  preferences: z.any().optional(),
});

router.use(authenticate);

router.get("/me", profilesController.getMe);
router.put("/me", validate(updateProfileSchema), profilesController.updateMe);

// Photo upload - using express.raw for simple buffer handling
router.post(
  "/me/photo",
  express.raw({ type: "image/*", limit: "5mb" }),
  profilesController.uploadAvatar
);

// Project media upload
router.post(
  "/me/projects/media",
  express.raw({ type: ["image/*", "video/*"], limit: "10mb" }),
  profilesController.uploadProjectMedia
);

router.get("/search", profilesController.searchProfiles);
router.get("/:userId", profilesController.getProfile);

export default router;
