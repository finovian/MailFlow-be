import type { Request, Response } from "express";
import * as templateService from "./template.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/response.js";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  TestSendInput,
  TemplateIdParam,
  TemplateListQuery,
} from "./template.types.js";

export async function create(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const data = req.body as CreateTemplateInput;
  const template = await templateService.create(userId, data);
  sendCreated(res, template, "Template created successfully");
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const query = req.query as unknown as TemplateListQuery;
  const result = await templateService.list(userId, query);
  sendPaginated(res, result.items, result.total, result.page, result.limit);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TemplateIdParam;
  const template = await templateService.getById(userId, id);
  sendSuccess(res, template, "Template retrieved successfully");
}

export async function update(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TemplateIdParam;
  const data = req.body as UpdateTemplateInput;
  const template = await templateService.update(userId, id, data);
  sendSuccess(res, template, "Template updated successfully");
}

export async function archive(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TemplateIdParam;
  const template = await templateService.archive(userId, id);
  sendSuccess(res, template, "Template archived successfully");
}

export async function testSend(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params as unknown as TemplateIdParam;
  const data = req.body as TestSendInput;
  const result = await templateService.testSend(userId, id, data);
  sendSuccess(res, result, "Test email sent successfully");
}
