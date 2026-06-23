import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/vk — VK OAuth (code flow). Ожидает: { code, redirect_uri }.
 *
 * СТАТУС: каркас (501). Для включения нужно:
 *   1. VK_CLIENT_ID + VK_CLIENT_SECRET (приложение VK ID).
 *   2. Обмен code -> access_token через https://oauth.vk.com/access_token,
 *      получить user_id и (опц) email; имя — через users.get.
 *   3. linkOrCreateUser("vk", String(userId), { email, fullName, photoUrl })
 *      и выдать JWT/куку как в /api/auth/telegram.
 */
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || "";
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || "";

export async function POST(request: NextRequest) {
  if (!VK_CLIENT_ID || !VK_CLIENT_SECRET) {
    return NextResponse.json(
      { success: false, error: "VK вход не настроен (VK_CLIENT_ID/VK_CLIENT_SECRET)" },
      { status: 501 }
    );
  }

  const { code, redirect_uri } = await request.json().catch(() => ({}));
  if (!code || !redirect_uri) {
    return NextResponse.json(
      { success: false, error: "Missing code/redirect_uri" },
      { status: 400 }
    );
  }

  // TODO: обмен code -> access_token + user_id, затем linkOrCreateUser("vk", ...).
  return NextResponse.json(
    { success: false, error: "VK verification not implemented yet" },
    { status: 501 }
  );
}
