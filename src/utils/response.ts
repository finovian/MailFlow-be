import type { Response } from "express";
import type { ApiSuccessResponse, PaginatedData } from "../types/api.types.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200,
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string,
): void {
  sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message = "Data retrieved successfully",
): void {
  const paginatedData: PaginatedData<T> = {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
  sendSuccess(res, paginatedData, message);
}
