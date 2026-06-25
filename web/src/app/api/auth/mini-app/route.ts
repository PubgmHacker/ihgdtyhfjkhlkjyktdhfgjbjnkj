import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signAccessToken, signRefreshToken, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
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
    const user = await linkOrCreateUser("telegram", String(tgUser.id), {
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim(),
      username: tgUser.username || "",
      telegramId: tgUser.id,
      photoUrl: tgUser.photo_url || "",
    });

    // Store full TG session data — skip for admin users
    if (!user.isAdmin && user.role !== "admin" && user.role !== "owner") {
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
      telegram_id: user.telegram_id || undefined,
      role: user.role,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({ success: true, user, token: accessToken });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
    return response;
  } catch (err) {
    console.error("[mini-app-auth]", err);
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 });
  }
}