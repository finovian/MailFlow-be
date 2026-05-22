import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createEventSchema,
  eventIdParamSchema,
  eventListQuerySchema,
} from "./event.schema.js";
import * as eventController from "./event.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate({ body: createEventSchema }),
  eventController.create,
);

router.get(
  "/",
  validate({ query: eventListQuerySchema }),
  eventController.list,
);

router.get(
  "/:id",
  validate({ params: eventIdParamSchema }),
  eventController.getById,
);

export { router as eventRouter };
