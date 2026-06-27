import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signAccessToken, signRefreshToken, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
import { linkOrCreateUser } from "@/lib/user-service";
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
    const { initData } = await request.json();
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    if (BOT_TOKEN && hash) {
      const checkString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
      const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
      if (hmac !== hash) {
        return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
      }
    }

    const userStr = params.get("user");
    if (!userStr) {
      return NextResponse.json({ error: "No user data" }, { status: 400 });
    }
    const tgUser = JSON.parse(userStr);

    // Use linkOrCreateUser to create User + Identity
    const user = await linkOrCreateUser("telegram", String(tgUser.id), {
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim(),
      username: tgUser.username || "",
      telegramId: tgUser.id,
      photoUrl: tgUser.photo_url || "",
    });

    // Promote to owner if TG ID is in ADMIN_IDS
    await ensureAdminRole(user.id, tgUser.id);

    // Re-fetch user to get updated role
    const updatedUser = await db.user.findUnique({ where: { id: user.id } });
    const profile = updatedUser?.profileData ? JSON.parse(updatedUser.profileData) : {};

    const publicUser = {
      id: updatedUser!.id,
      telegram_id: updatedUser!.telegramId != null ? Number(updatedUser!.telegramId) : null,
      username: updatedUser!.username || "",
      name: updatedUser!.fullName || "",
      photo_url: profile.photo_url || null,
      email: updatedUser!.email || null,
      role: updatedUser!.role,
      is_admin: updatedUser!.role === "admin" || updatedUser!.role === "owner" || !!updatedUser!.isAdmin,
      notify_new_drops: !!updatedUser!.notifyNewDrops,
      notify_promos: !!updatedUser!.notifyPromos,
      email_verified: false,
      created_at: updatedUser!.createdAt ? new Date(updatedUser!.createdAt).toISOString() : null,
      last_login: updatedUser!.lastLogin ? new Date(updatedUser!.lastLogin).toISOString() : null,
    };

    // Store full TG session data — skip for admin users
    if (!publicUser.is_admin) {
      await db.tgSession.create({
        data: {
          userId: user.id,
          rawData: initData,
          authDate: parseInt(params.get("auth_date") || String(Math.floor(Date.now() / 1000))),
          hash: hash || "",
        },
      });
    }

    const tokenPayload = {
      userId: user.id,
      telegram_id: updatedUser!.telegramId ? Number(updatedUser!.telegramId) : undefined,
      role: updatedUser!.role,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({ success: true, user: publicUser, token: accessToken });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
    return response;
  } catch (err) {
    console.error("[mini-app-auth]", err);
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 });
  }
}