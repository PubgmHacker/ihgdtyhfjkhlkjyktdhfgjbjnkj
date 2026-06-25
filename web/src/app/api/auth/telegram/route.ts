import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signAccessToken, signRefreshToken, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";
import { linkOrCreateUser } from "@/lib/user-service";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

    // Verify hash if BOT_TOKEN is set
    if (BOT_TOKEN) {
      const { hash, ...params } = data;
      const checkString = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("\n");
      const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
      const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
      if (hmac !== hash) {
        return NextResponse.json({ error: "Подпись неверна" }, { status: 401 });
      }
    }

    // Use linkOrCreateUser to create both User + Identity
    const user = await linkOrCreateUser("telegram", String(data.id), {
      fullName: [data.first_name, data.last_name].filter(Boolean).join(" ").trim(),
      username: data.username || "",
      telegramId: data.id,
      photoUrl: data.photo_url || "",
    });

    // Store full TG session data as logs
    await db.tgSession.create({
      data: {
        userId: user.id,
        rawData: JSON.stringify(data),
        authDate: data.auth_date || Math.floor(Date.now() / 1000),
        hash: data.hash || "",
      },
    });

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
    console.error("[telegram-auth]", err);
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 });
  }
}