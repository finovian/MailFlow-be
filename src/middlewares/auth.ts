import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { UnauthorizedError } from "../utils/errors.js";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed authorization header");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Missing bearer token");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  req.user = {
    id: user.id,
    email: user.email ?? "",
  };

  next();
}