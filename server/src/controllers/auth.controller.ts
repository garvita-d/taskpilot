import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../model/User";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: Response, userId: string, role: string) {
  const token = jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token, {
    httpOnly: true, // JS in the browser cannot read it
    secure: env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // basic CSRF protection
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const exists = await User.findOne({ email });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  setAuthCookie(res, user.id, user.role);
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) throw new AppError(401, "Invalid email or password");

  setAuthCookie(res, user.id, user.role);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, "User not found");
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
}
