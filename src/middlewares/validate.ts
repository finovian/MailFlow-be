import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        const validatedParams = schemas.params.parse(req.params);
        // Clear and re-assign to ensure only validated fields remain and coerced types are preserved
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, validatedParams);
      }

      if (schemas.query) {
        const validatedQuery = schemas.query.parse(req.query);
        // Clear and re-assign
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, validatedQuery);
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}