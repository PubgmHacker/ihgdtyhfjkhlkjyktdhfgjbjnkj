import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signAccessToken, signRefreshToken, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, isConfiguredAdmin } from "@/lib/auth";
import { linkOrCreateUser } from "@/lib/user-service";
import { db } from "@/lib/db";

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
    // IMPORTANT: Prisma schema stores telegramId as BigInt — convert explicitly.
    const tgId = typeof tgUser.id === "number" ? BigInt(tgUser.id) : tgUser.id;
    const user = await linkOrCreateUser("telegram", String(tgUser.id), {
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim(),
      username: tgUser.username || "",
      telegramId: tgId,
      photoUrl: tgUser.photo_url || "",
    });

    // Re-fetch user to get current state
    const updatedUser = await db.user.findUnique({ where: { id: user.id } });
    const profile = updatedUser?.profileData ? JSON.parse(updatedUser.profileData) : {};

    // ADMIN_IDS env var is the source of truth — always override if listed.
    const tgNumId = tgUser.id as number;
    const envAdmin = isConfiguredAdmin(tgNumId);
    let finalRole = updatedUser!.role || "user";
    if (envAdmin && finalRole !== "owner" && finalRole !== "admin") {
      finalRole = "owner";
      await db.user.update({
        where: { id: user.id },
        data: { role: "owner", isAdmin: true },
      }).catch(() => {});
    }
    const finalIsAdmin = envAdmin || finalRole === "admin" || finalRole === "owner" || !!updatedUser!.isAdmin;

    const publicUser = {
      id: updatedUser!.id,
      telegram_id: updatedUser!.telegramId != null ? Number(updatedUser!.telegramId) : null,
      username: updatedUser!.username || "",
      name: updatedUser!.fullName || "",
      photo_url: profile.photo_url || null,
      email: updatedUser!.email || null,
      role: finalIsAdmin ? "owner" : finalRole,
      is_admin: finalIsAdmin,
      notify_new_drops: !!updatedUser!.notifyNewDrops,
      notify_promos: !!updatedUser!.notifyPromos,
      email_verified: false,
      created_at: updatedUser!.createdAt ? new Date(updatedUser!.createdAt).toISOString() : null,
      last_login: updatedUser!.lastLogin ? new Date(updatedUser!.lastLogin).toISOString() : null,
    };

    // Store full TG session data — skip for admin users
    if (!finalIsAdmin) {
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
      role: finalIsAdmin ? "owner" : finalRole,
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
