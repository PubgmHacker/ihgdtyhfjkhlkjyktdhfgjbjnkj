import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { getAllTemplates, getTemplate, renderTemplate, broadcastToTgUsers } from "@/lib/tg-broadcast";
import { db } from "@/lib/db";

// GET /api/admin/templates — list all templates
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const templates = await getAllTemplates();
  return NextResponse.json({ templates });
}