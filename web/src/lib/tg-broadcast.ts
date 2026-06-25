import { db } from "@/lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

// ── Video banner paths (pre-rendered with ffmpeg) ──
export const VIDEO_BANNERS = {
  drop: "/tg-media/banner-drop.mp4",
  promo: "/tg-media/banner-promo.mp4",
} as const;

// Send message to single user via Telegram
// Priority: video > photo > text-only
export async function sendTgMessage(
  chatId: number,
  text: string,
  photoUrl?: string,
  videoUrl?: string
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error("[tg-bot] BOT_TOKEN not set");
    return false;
  }

  const baseUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    // 1. Video with caption (highest priority — "живые" баннеры)
    if (videoUrl) {
      const res = await fetch(`${baseUrl}/sendVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          video: videoUrl,
          caption: text,
          parse_mode: "HTML",
          supports_streaming: true,
        }),
      });
      const data = await res.json();
      if (data.ok) return true;
      // Fallback to photo if video fails
      console.warn("[tg-bot] sendVideo failed, falling back to photo", data.description);
    }

    // 2. Photo with caption
    if (photoUrl) {
      const res = await fetch(`${baseUrl}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: text,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      return !!data.ok;
    }

    // 3. Text only
    const res = await fetch(`${baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    return !!data.ok;
  } catch (err) {
    console.error("[tg-bot] send error:", err);
    return false;
  }
}

// Broadcast to all TG users — supports video banners
export async function broadcastToTgUsers(
  text: string,
  photoUrl?: string,
  videoUrl?: string
): Promise<{ sent: number; failed: number }> {
  const users = await db.user.findMany({
    where: { telegramId: { not: null }, isActive: true },
    select: { telegramId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const ok = await sendTgMessage(user.telegramId!, text, photoUrl, videoUrl);
    if (ok) sent++;
    else failed++;
    // Rate limit: max 30 msg/sec for bots, video needs slower rate
    await new Promise((r) => setTimeout(r, videoUrl ? 100 : 40));
  }

  return { sent, failed };
}

// Get template by type with variables filled
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

// Seed default templates (idempotent) — dark metallic SOULDAWN aesthetic
// Templates with hasVideo=true use pre-rendered video banners instead of static photos
export async function seedTemplates() {
  const templates = [
    {
      type: "drop",
      name: "Новый дроп (видео)",
      bodyTemplate:
        "<i>Новый дроп</i>\n\n<b>{{title}}</b>\n\n{{description}}\n\n— {{price}} —\n\n▸ Заказать: {{link}}",
      hasPhoto: false,
      photoUrl: "",
      hasVideo: true,
      videoUrl: VIDEO_BANNERS.drop,
    },
    {
      type: "promo",
      name: "Промокод (видео)",
      bodyTemplate:
        "<i>Специальное предложение</i>\n\nКод: <code>{{code}}</code>\n\n{{description}}\n\nДействует до: {{expiry}}\n\n▸ Активировать: {{link}}",
      hasPhoto: false,
      photoUrl: "",
      hasVideo: true,
      videoUrl: VIDEO_BANNERS.promo,
    },
    {
      type: "news",
      name: "Новость бренда",
      bodyTemplate:
        "━━━━━━━━━━━━━━━━\n<b>S O U L · D A W N</b>\n━━━━━━━━━━━━━━━━\n\n<i>Обновление</i>\n\n<b>{{title}}</b>\n\n{{text}}",
      hasPhoto: false,
      photoUrl: "",
      hasVideo: false,
      videoUrl: "",
    },
    {
      type: "restock",
      name: "Пополнение размеров (видео)",
      bodyTemplate:
        "<i>Пополнение</i>\n\n<b>{{product}}</b>\n\n{{description}}\n\nРазмеры: {{sizes}}\n\n▸ {{link}}",
      hasPhoto: false,
      photoUrl: "",
      hasVideo: true,
      videoUrl: VIDEO_BANNERS.drop,
    },
  ];

  for (const t of templates) {
    await db.broadcastTemplate.upsert({
      where: { type: t.type },
      create: t,
      update: {
        name: t.name,
        bodyTemplate: t.bodyTemplate,
        hasPhoto: t.hasPhoto,
        photoUrl: t.photoUrl,
        hasVideo: t.hasVideo,
        videoUrl: t.videoUrl,
      },
    });
  }
}

export async function getAllTemplates() {
  await seedTemplates();
  return db.broadcastTemplate.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getTemplate(type: string) {
  await seedTemplates();
  return db.broadcastTemplate.findUnique({ where: { type } });
}