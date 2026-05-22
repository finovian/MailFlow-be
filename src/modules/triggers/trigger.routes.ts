import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createTriggerSchema,
  updateTriggerSchema,
  triggerIdParamSchema,
  triggerListQuerySchema,
} from "./trigger.schema.js";
import * as triggerController from "./trigger.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate({ body: createTriggerSchema }),
  triggerController.create,
);

router.get(
  "/",
  validate({ query: triggerListQuerySchema }),
  triggerController.list,
);

router.get(
  "/:id",
  validate({ params: triggerIdParamSchema }),
  triggerController.getById,
);

router.patch(
  "/:id",
  validate({ params: triggerIdParamSchema, body: updateTriggerSchema }),
  triggerController.update,
);

router.delete(
  "/:id",
  validate({ params: triggerIdParamSchema }),
  triggerController.deactivate,
);

export { router as triggerRouter };
