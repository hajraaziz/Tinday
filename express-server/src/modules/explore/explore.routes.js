import express from "express";
import * as exploreController from "./explore.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", exploreController.getFeed);

export default router;
