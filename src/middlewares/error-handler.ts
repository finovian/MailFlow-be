import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, ValidationError } from "../utils/errors.js";
import { createModuleLogger } from "../lib/logger.js";
import type { ApiErrorResponse } from "../types/api.types.js";

const log = createModuleLogger("error-handler");

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    const response: ApiErrorResponse = {
      success: false,
      message: "Validation failed",
      errors,
    };

    res.status(422).json(response);
    return;
  }

  // App-level typed errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
    };

    if (!err.isOperational) {
      log.error({ err }, "Non-operational error");
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaResponse = handlePrismaError(err);
    res.status(prismaResponse.statusCode).json(prismaResponse.body);
    return;
  }

  // Unknown errors — log full details, return safe message
  log.error({ err, stack: err.stack }, "Unhandled error");

  const response: ApiErrorResponse = {
    success: false,
    message: "An unexpected error occurred",
  };

  res.status(500).json(response);
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  body: ApiErrorResponse;
} {
  switch (error.code) {
    case "P2002": {
      const target = (error.meta?.target as string[])?.join(", ") ?? "field";
      return {
        statusCode: 409,
        body: {
          success: false,
          message: `A record with this ${target} already exists`,
        },
      };
    }

    case "P2025":
      return {
        statusCode: 404,
        body: {
          success: false,
          message: "Record not found",
        },
      };

    case "P2003":
      return {
        statusCode: 400,
        body: {
          success: false,
          message: "Related record not found",
        },
      };

    default:
      log.error({ code: error.code, meta: error.meta }, "Unhandled Prisma error");
      return {
        statusCode: 500,
        body: {
          success: false,
          message: "A database error occurred",
        },
      };
  }
}
