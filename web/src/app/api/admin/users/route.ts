import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/users — list all users
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      identities: { select: { provider: true, providerUid: true, createdAt: true } },
      _count: { select: { orders: true, tgSessions: true } },
    },
  });

  return NextResponse.json({ users });
}