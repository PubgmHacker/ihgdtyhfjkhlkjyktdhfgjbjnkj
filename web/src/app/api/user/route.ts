import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user-service";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserById(auth.userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const data: Record<string, any> = {};
  if (body.fullName !== undefined) data.fullName = body.fullName.trim();
  if (body.notifyNewDrops !== undefined) data.notifyNewDrops = body.notifyNewDrops;
  if (body.notifyPromos !== undefined) data.notifyPromos = body.notifyPromos;

  const user = await db.user.update({ where: { id: auth.userId }, data });
  const profile = (user.profileData as any) ? JSON.parse(user.profileData) : {};
  return NextResponse.json({
    id: user.id,
    telegram_id: user.telegramId != null ? Number(user.telegramId) : null,
    username: user.username,
    name: user.fullName,
    photo_url: profile.photo_url || null,
    email: user.email,
    role: user.role,
    is_admin: user.role === "admin" || user.role === "owner",
  });
}