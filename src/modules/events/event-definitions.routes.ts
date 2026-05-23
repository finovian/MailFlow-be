import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import * as eventDefinitionsController from "./event-definitions.controller.js";

const router = Router();

// Secure all event definition endpoints
router.use(authMiddleware);

router.get("/", eventDefinitionsController.list);
router.get("/:type", eventDefinitionsController.getByType);

export { router as eventDefinitionsRouter };
