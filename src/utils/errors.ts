export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    errors: Array<{ field?: string; message: string }> = [],
  ) {
    super(message, 422);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(msg, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
