import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/admin/notify — broadcast notification to all users
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const { title, body, type, targetAll, userIds } = await request.json();
  if (!title || !body) return NextResponse.json({ error: "title и body обязательны" }, { status: 400 });

  const targetIds = targetAll
    ? (await db.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => u.id)
    : userIds || [];

  const result = await db.notification.createMany({
    data: targetIds.map((uid: string) => ({
      userId: uid,
      title,
      body,
      type: type || "info",
      createdBy: auth.userId,
    })),
  });

  // Create welcome-like system notification for new auth
  return NextResponse.json({
    success: true,
    sent: result.count,
  });
}