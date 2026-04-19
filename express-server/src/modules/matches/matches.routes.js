import express from "express";
import * as matchesController from "./matches.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", matchesController.listMatches);

export default router;
