import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/apple — Sign in with Apple. Ожидает: { id_token, user? }.
 *
 * СТАТУС: каркас (501). Для включения нужно:
 *   1. APPLE_CLIENT_ID (Service ID из Apple Developer).
 *   2. Верификация id_token по JWKS https://appleid.apple.com/auth/keys
 *      (сверить aud == APPLE_CLIENT_ID, iss == https://appleid.apple.com, exp).
 *   3. Из payload взять sub (providerUid) и email, далее:
 *      linkOrCreateUser("apple", sub, { email, fullName }) и выдать JWT/куку
 *      как в /api/auth/telegram.
 */
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";

export async function POST(request: NextRequest) {
  if (!APPLE_CLIENT_ID) {
    return NextResponse.json(
      { success: false, error: "Apple Sign-In не настроен (APPLE_CLIENT_ID)" },
      { status: 501 }
    );
  }

  const { id_token } = await request.json().catch(() => ({}));
  if (!id_token) {
    return NextResponse.json({ success: false, error: "Missing id_token" }, { status: 400 });
  }

  // TODO: верификация id_token по JWKS Apple, затем linkOrCreateUser("apple", sub, ...).
  return NextResponse.json(
    { success: false, error: "Apple verification not implemented yet" },
    { status: 501 }
  );
}
