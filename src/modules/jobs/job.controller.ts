import type { Request, Response } from "express";
import * as jobService from "./job.service.js";
import { sendSuccess, sendPaginated } from "../../utils/response.js";
import type { JobIdParam, JobListQuery } from "./job.types.js";

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const query = req.query as unknown as JobListQuery;
  const result = await jobService.list(userId, query);
  sendPaginated(res, result.items, result.total, result.page, result.limit);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as JobIdParam;
  const job = await jobService.getById(userId, id);
  sendSuccess(res, job, "Email job retrieved successfully");
}

export async function retry(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as JobIdParam;
  const job = await jobService.retry(userId, id);
  sendSuccess(res, job, "Job queued for retry");
}
