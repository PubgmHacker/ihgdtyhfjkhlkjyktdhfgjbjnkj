import { NextResponse } from "next/server";
import { verifyToken, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const hasAccess = !!request.headers.get("cookie")?.includes(ACCESS_TOKEN_COOKIE);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || "";
  let payload: any = null;
  let dbUser: any = null;
  if (accessToken) {
    payload = verifyToken(accessToken);
    if (payload?.userId) {
      try {
        dbUser = await db.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true, isAdmin: true, telegramId: true, username: true } });
      } catch (e: any) { dbUser = { error: String(e) }; }
    }
  }
  return NextResponse.json({
    env: { ADMIN_IDS: process.env.ADMIN_IDS || "(NOT SET)", BOT_TOKEN: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN ? "(SET)" : "(NOT SET)" },
    cookies: { hasAccess },
    jwt: payload ? { userId: payload.userId, role: payload.role, telegram_id: payload.telegram_id } : null,
    db: dbUser ? { ...dbUser, telegramId: dbUser.telegramId != null ? Number(dbUser.telegramId) : null } : null,
  });
}
