import { Router } from "express";
import { z } from "zod";
import * as authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const resendSchema = z.object({
  email: z.string().email(),
});

router.post("/register", validate(registerSchema), authController.register);
router.post(
  "/resend-confirmation",
  validate(resendSchema),
  authController.resendConfirmation,
);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);

router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/oauth-sync", authenticate, authController.oauthSync);

export default router;
