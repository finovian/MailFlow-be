import type { Request, Response } from "express";
import * as logService from "./log.service.js";
import { sendSuccess, sendPaginated } from "../../utils/response.js";
import type { LogIdParam, LogListQuery } from "./log.types.js";

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as LogIdParam;
  const sendLog = await logService.getById(userId, id);
  sendSuccess(res, sendLog, "Log retrieved successfully");
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const query = req.query as unknown as LogListQuery;
  const result = await logService.list(userId, query);
  sendPaginated(res, result.items, result.total, result.page, result.limit);
}
