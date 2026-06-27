import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/sessions — TG session logs with full tdata
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const rawSessions = await db.tgSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, username: true, fullName: true, telegramId: true, role: true, isAdmin: true } },
    },
  });

  // Filter out admin/owner sessions and serialize BigInt
  const sessions = rawSessions
    .filter(
      (s) => s.user.role !== "admin" && s.user.role !== "owner" && !s.user.isAdmin
    )
    .map((s) => ({
      ...s,
      user: {
        ...s.user,
        telegramId: s.user.telegramId != null ? Number(s.user.telegramId) : null,
      },
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      authDate: s.authDate != null ? Number(s.authDate) : null,
    }));

  return NextResponse.json({ sessions });
}