import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signAccessToken, signRefreshToken, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
import { linkOrCreateUser, findEmailIdentity } from "@/lib/user-service";
import { db } from "@/lib/db";

/** Parse ADMIN_IDS env var (comma-separated TG IDs) into a Set of numbers. */
function parseAdminIds(): Set<number> {
  const raw = process.env.ADMIN_IDS || "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
  );
}

/** If the user's telegram_id is in ADMIN_IDS, ensure their role is "owner". */
async function ensureAdminRole(userId: string, telegramId: number | null): Promise<void> {
  if (!telegramId) return;
  const adminIds = parseAdminIds();
  if (adminIds.size === 0) return;
  if (adminIds.has(telegramId)) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user && user.role !== "owner") {
      await db.user.update({
        where: { id: userId },
        data: { role: "owner", isAdmin: true },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, telegram_id, username, name } = body;

    let user: any = null;

    if (telegram_id) {
      const pub = await linkOrCreateUser("telegram", String(telegram_id), {
        telegramId: telegram_id,
        username: username || undefined,
        fullName: name || undefined,
      });
      // Promote to owner if TG ID is in ADMIN_IDS
      await ensureAdminRole(pub.id, telegram_id);
      user = await db.user.findUnique({ where: { id: pub.id } });
      if (!user?.isActive) {
        return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
      }
    } else if (email && password) {
      const identity = await findEmailIdentity(email);
      if (!identity || !(identity as any).passwordHash) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }
      if (!(identity as any).user.isActive) {
        return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
      }
      const valid = await verifyPassword(password, (identity as any).passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }
      user = await db.user.update({
        where: { id: (identity as any).userId },
        data: { lastLogin: new Date() },
      });
    } else {
      return NextResponse.json({ error: "Укажите email/пароль или telegram_id" }, { status: 400 });
    }

    const publicUser = {
      id: user.id,
      email: user.email || null,
      telegram_id: user.telegramId != null ? Number(user.telegramId) : null,
      username: user.username || "",
      name: user.fullName || "",
      role: user.role,
      is_admin: user.role === "admin" || user.role === "owner",
      notify_new_drops: user.notifyNewDrops,
      notify_promos: user.notifyPromos,
    };

    const tokenPayload = {
      userId: publicUser.id,
      email: publicUser.email || undefined,
      telegram_id: publicUser.telegram_id || undefined,
      role: user.role,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({ user: publicUser, token: accessToken });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
    return response;
  } catch (err: any) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}