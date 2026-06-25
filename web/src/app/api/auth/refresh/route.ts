import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signAccessToken, REFRESH_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE, signRefreshToken } from "@/lib/auth";
import { getUserById } from "@/lib/user-service";

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
  const tokenPayload = {
    userId: user.id,
    email: user.email || undefined,
    telegram_id: user.telegram_id || undefined,
    role: user.role,
  };
  const newAccess = signAccessToken(tokenPayload);
  const newRefresh = signRefreshToken(tokenPayload);

  const response = NextResponse.json({ token: newAccess });
  response.cookies.set(ACCESS_TOKEN_COOKIE, newAccess, cookieOptions(ACCESS_MAX_AGE));
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefresh, cookieOptions(REFRESH_MAX_AGE));
  return response;
}