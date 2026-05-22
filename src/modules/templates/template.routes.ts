import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
  testSendSchema,
  templateIdParamSchema,
  templateListQuerySchema,
} from "./template.schema.js";
import * as templateController from "./template.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  validate({ body: createTemplateSchema }),
  templateController.create,
);

router.get(
  "/",
  validate({ query: templateListQuerySchema }),
  templateController.list,
);

router.get(
  "/:id",
  validate({ params: templateIdParamSchema }),
  templateController.getById,
);

router.patch(
  "/:id",
  validate({ params: templateIdParamSchema, body: updateTemplateSchema }),
  templateController.update,
);

router.delete(
  "/:id",
  validate({ params: templateIdParamSchema }),
  templateController.archive,
);

router.post(
  "/:id/test-send",
  validate({ params: templateIdParamSchema, body: testSendSchema }),
  templateController.testSend,
);

export { router as templateRouter };
