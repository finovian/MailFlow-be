import type { Request, Response } from "express";
import * as triggerService from "./trigger.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response.js";
import type {
  CreateTriggerInput,
  UpdateTriggerInput,
  TriggerIdParam,
  TriggerListQuery,
} from "./trigger.types.js";

export async function create(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const data = req.body as CreateTriggerInput;
  const trigger = await triggerService.create(userId, data);
  sendCreated(res, trigger, "Trigger created successfully");
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const query = req.query as unknown as TriggerListQuery;
  const result = await triggerService.list(userId, query);
  sendPaginated(res, result.items, result.total, result.page, result.limit);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TriggerIdParam;
  const trigger = await triggerService.getById(userId, id);
  sendSuccess(res, trigger, "Trigger retrieved successfully");
}

export async function update(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TriggerIdParam;
  const data = req.body as UpdateTriggerInput;
  const trigger = await triggerService.update(userId, id, data);
  sendSuccess(res, trigger, "Trigger updated successfully");
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TriggerIdParam;
  const trigger = await triggerService.deactivate(userId, id);
  sendSuccess(res, trigger, "Trigger deactivated successfully");
}
