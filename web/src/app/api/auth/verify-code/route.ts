import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  signAccessToken,
  signRefreshToken,
  cookieOptions,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth";
import { linkOrCreateUser, findEmailIdentity } from "@/lib/user-service";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Укажите email и код" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    // Find valid, non-expired, non-used code
    const verification = await db.emailVerification.findFirst({
      where: {
        email: normalized,
        code,
        verified: false,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Неверный или просроченный код" },
        { status: 400 }
      );
    }

    // Mark as verified and used
    await db.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true, used: true },
    });

    // Check if user already exists with this email
    const existingIdentity = await findEmailIdentity(normalized);

    let user;
    if (existingIdentity) {
      // Login existing user
      user = await db.user.update({
        where: { id: (existingIdentity as any).userId },
        data: { lastLogin: new Date() },
      });
    } else {
      // Create new user (no password needed — email-verified)
      user = await linkOrCreateUser("email", normalized, {
        email: normalized,
        fullName: "Покупатель",
        passwordHash: null,
      });
    }

    if (!user?.isActive) {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
    }

    // Issue tokens and login
    const tokenPayload = { userId: user.id, email: user.email || undefined, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const publicUser = {
      id: user.id,
      email: user.email || null,
      telegram_id: user.telegramId || null,
      username: user.username || "",
      name: user.fullName || "",
      role: user.role,
      is_admin: user.role === "admin" || user.role === "owner",
      notify_new_drops: user.notifyNewDrops,
      notify_promos: user.notifyPromos,
    };

    const response = NextResponse.json({ success: true, user: publicUser, token: accessToken });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
    return response;
  } catch (err) {
    console.error("[verify-code]", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}