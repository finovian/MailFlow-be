import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { jobIdParamSchema, jobListQuerySchema } from "./job.schema.js";
import * as jobController from "./job.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  validate({ query: jobListQuerySchema }),
  jobController.list,
);

router.get(
  "/:id",
  validate({ params: jobIdParamSchema }),
  jobController.getById,
);

router.post(
  "/:id/retry",
  validate({ params: jobIdParamSchema }),
  jobController.retry,
);

export { router as jobRouter };
