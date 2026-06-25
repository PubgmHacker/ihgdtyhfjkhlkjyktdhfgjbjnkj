import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken, signRefreshToken, REFRESH_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "@/lib/auth";
import { getUserById } from "@/lib/user-service";
import { db } from "@/lib/db";

/** Parse ADMIN_IDS env var (comma-separated TG IDs) into a Set of numbers. */
function parseAdminIds(): Set<number> {
  const raw = process.env.ADMIN_IDS || "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
  );
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }
  const payload = verifyToken(refreshToken);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const user = await getUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Auto-promote if TG ID is in ADMIN_IDS
  const adminIds = parseAdminIds();
  let role = user.role;
  let is_admin = user.is_admin;
  if (user.telegram_id && adminIds.size > 0 && adminIds.has(user.telegram_id)) {
    if (role !== "owner") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "owner", isAdmin: true },
      });
      role = "owner";
      is_admin = true;
    }
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email || undefined,
    telegram_id: user.telegram_id || undefined,
    role,
  };
  const newAccess = signAccessToken(tokenPayload);
  const newRefresh = signRefreshToken(tokenPayload);

  const response = NextResponse.json({ token: newAccess });
  response.cookies.set(ACCESS_TOKEN_COOKIE, newAccess, cookieOptions(ACCESS_MAX_AGE));
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefresh, cookieOptions(REFRESH_MAX_AGE));
  return response;
}