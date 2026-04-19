import express from "express";
import { z } from "zod";
import * as swipesController from "./swipes.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

const swipeSchema = z.object({
  receiver_id: z.string().uuid(),
  direction: z.enum(["RIGHT", "LEFT"]),
});

router.use(authenticate);

router.post("/", validate(swipeSchema), swipesController.createSwipe);

export default router;
