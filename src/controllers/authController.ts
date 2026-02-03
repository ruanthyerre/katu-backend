import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { signAccessToken } from "../utils/jwt";

const prisma = new PrismaClient();
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email_password_required" });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "user_exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: "PATIENT" },
  });

  res.status(201).json({ id: user.id, email: user.email, name: user.name });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email_password_required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const accessToken = signAccessToken(user.id);
  // create a refresh token (UUID) stored in DB
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  await prisma.refreshToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  res.json({ accessToken, refreshToken: token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refresh_required" });

  const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!record) return res.status(401).json({ error: "invalid_refresh" });
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    return res.status(401).json({ error: "expired_refresh" });
  }

  const accessToken = signAccessToken(record.userId);
  res.json({ accessToken });
}

/**
 * Logout (revoke a single refresh token)
 * Body: { refreshToken }
 */
export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refresh_required" });

  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  res.json({ ok: true });
}

/**
 * Logout all sessions for the authenticated user (requires requireAuth)
 */
export async function logoutAll(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  await prisma.refreshToken.deleteMany({ where: { userId } });
  res.json({ ok: true });
}
