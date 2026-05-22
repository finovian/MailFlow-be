import type { Request, Response } from "express";
import * as eventService from "./event.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response.js";
import type { CreateEventInput, EventIdParam, EventListQuery } from "./event.types.js";

export async function create(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const data = req.body as CreateEventInput;
  const event = await eventService.create(userId, data);
  sendCreated(res, event, "Event created and queued for processing");
}

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as EventIdParam;
  const event = await eventService.getById(userId, id);
  sendSuccess(res, event, "Event retrieved successfully");
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const query = req.query as unknown as EventListQuery;
  const result = await eventService.list(userId, query);
  sendPaginated(res, result.items, result.total, result.page, result.limit);
}
