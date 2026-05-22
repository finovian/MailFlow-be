import { Router } from "express";
import { templateRouter } from "../modules/templates/template.routes.js";
import { triggerRouter } from "../modules/triggers/trigger.routes.js";
import { eventRouter } from "../modules/events/event.routes.js";
import { jobRouter } from "../modules/jobs/job.routes.js";
import { logRouter } from "../modules/logs/log.routes.js";

const router = Router();

router.use("/templates", templateRouter);
router.use("/triggers", triggerRouter);
router.use("/events", eventRouter);
router.use("/jobs", jobRouter);
router.use("/logs", logRouter);

export { router as apiRouter };
