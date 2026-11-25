import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { Role } from "../model/User";

export interface AuthRequest extends Request {
  user?: { id: string; role: Role };
}

export function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;
  if (!token) throw new AppError(401, "Not authenticated");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      role: Role;
    };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}
