import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { logIdParamSchema, logListQuerySchema } from "./log.schema.js";
import * as logController from "./log.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  validate({ query: logListQuerySchema }),
  logController.list,
);

router.get(
  "/:id",
  validate({ params: logIdParamSchema }),
  logController.getById,
);

export { router as logRouter };
