import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { broadcastToTgUsers, renderTemplate, getTemplate, seedTemplates } from "@/lib/tg-broadcast";

// POST /api/admin/broadcast — send broadcast from template
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const { templateType, vars, photoUrl, previewOnly } = await request.json();
  if (!templateType) return NextResponse.json({ error: "templateType required" }, { status: 400 });

  await seedTemplates();
  const template = await db.broadcastTemplate.findUnique({ where: { type: templateType } });
  if (!template) return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });

  const text = renderTemplate(template.bodyTemplate, vars || {});

  // Preview mode — just return the rendered text
  if (previewOnly) {
    return NextResponse.json({
      preview: text,
      hasPhoto: template.hasPhoto || !!photoUrl,
      hasVideo: template.hasVideo,
      videoUrl: template.videoUrl,
    });
  }

  // Determine media: video takes priority over photo
  const effectivePhotoUrl = template.hasPhoto ? (photoUrl || template.photoUrl) : undefined;
  const effectiveVideoUrl = template.hasVideo ? template.videoUrl : undefined;

  // 1. Send to Telegram users (video > photo > text)
  const tgResult = await broadcastToTgUsers(text, effectivePhotoUrl, effectiveVideoUrl);

  // 2. Save in-app notification to all users
  const allUsers = await db.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let title = template.name;
  if (templateType === "drop") title = vars?.title || "Новый дроп";
  if (templateType === "promo") title = `Промокод: ${vars?.code || ""}`;

  await db.notification.createMany({
    data: allUsers.map((u) => ({
      userId: u.id,
      title,
      body: text.replace(/<[^>]+>/g, ""), // strip HTML for in-app
      type: `broadcast_${templateType}`,
      createdBy: auth.userId,
    })),
  });

  // 3. Save broadcast record
  await db.broadcast.create({
    data: {
      templateType,
      title,
      body: text,
      photoUrl: effectivePhotoUrl || "",
      videoUrl: effectiveVideoUrl || "",
      sentBy: auth.userId,
      sentCount: tgResult.sent + allUsers.length,
      status: "sent",
    },
  });

  return NextResponse.json({
    success: true,
    telegram: { sent: tgResult.sent, failed: tgResult.failed },
    inApp: allUsers.length,
    total: tgResult.sent + allUsers.length,
  });
}

// GET /api/admin/broadcast — list past broadcasts
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const broadcasts = await db.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ broadcasts });
}