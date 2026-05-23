import type { Request, Response } from "express";
import { getAllEventDefinitions, getEventDefinition } from "../../utils/eventRegistry.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../utils/errors.js";


export async function list(req: Request, res: Response): Promise<void> {
  const definitions = getAllEventDefinitions();
  sendSuccess(res, definitions, "Event definitions retrieved successfully");
}


export async function getByType(req: Request, res: Response): Promise<void> {
  const { type } = req.params as { type: string };
  const definition = getEventDefinition(type);
  if (!definition) {
    throw new NotFoundError("Event definition", type);
  }
  sendSuccess(res, definition, "Event definition retrieved successfully");
}
