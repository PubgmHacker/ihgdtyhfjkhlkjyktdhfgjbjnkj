import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "souldawn_jwt_secret_change_in_production";
const JWT_EXPIRES_IN = "24h";
const REFRESH_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  email?: string;
  telegram_id?: number;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Password helpers ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = "sd_access_token";
export const REFRESH_TOKEN_COOKIE = "sd_refresh_token";

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export const ACCESS_MAX_AGE = 60 * 60 * 24;       // 24 hours
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;  // 7 days

// ─── Role helpers ─────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin" | "owner";

export function isAdminRole(role: string): boolean {
  return role === "admin" || role === "owner";
}

export function isOwnerRole(role: string): boolean {
  return role === "owner";
}
