import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.telegram_id || body.telegramId || body.userId;

    if (!rawId) {
      return NextResponse.json({ error: "telegram_id обязателен" }, { status: 400 });
    }

    const tgId = BigInt(String(rawId).trim());

    // 1. Находим или создаем пользователя через Raw SQL
    const users: any[] = await prisma.$queryRaw`SELECT id FROM "users" WHERE "telegram_id" = ${tgId} LIMIT 1`;
    if (users.length === 0) {
      const name = body.name || `User_${tgId.toString().slice(0, 4)}`;
      const username = body.username || null;
      await prisma.$executeRaw`
        INSERT INTO "users" ("telegram_id", "name", "username") 
        VALUES (${tgId}, ${name}, ${username})
        ON CONFLICT ("telegram_id") DO NOTHING
      `;
    }

    const incomingText = body.message || body.text || body.subject || body.description || "Обращение из API";
    const categoryPrefix = body.category ? `[${String(body.category).toUpperCase()}] ` : "";
    const fullMessage = `${categoryPrefix}${incomingText}`;
    const subject = body.subject || "Без темы";

    // 2. Записываем тикет в базу данных PostgreSQL
    try {
      await prisma.$executeRaw`
        INSERT INTO "support_tickets" ("user_id", "subject", "message", "status")
        VALUES (${tgId}, ${subject}, ${fullMessage}, 'OPEN')
      `;
    } catch (e) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "support_tickets" ("user_id", "text", "status")
          VALUES (${tgId}, ${fullMessage}, 'OPEN')
        `;
      } catch (e2) {
        await prisma.$executeRaw`
          INSERT INTO "support_tickets" ("user_id", "status")
          VALUES (${tgId}, 'OPEN')
        `;
      }
    }

    // 3. ОТПРАВКА УВЕДОМЛЕНИЯ АДМИНИСТРАТОРУ В TELEGRAM
    const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_ID;

    if (TELEGRAM_BOT_TOKEN && ADMIN_CHAT_ID) {
      try {
        const text = `🔔 *Новая заявка на SOULDAWN!*\n\n` +
                     `👤 *От юзера:* \`${tgId.toString()}\`\n` +
                     `📝 *Тема:* ${subject}\n` +
                     `💬 *Сообщение:* _${fullMessage}_`;
        
        await fetch(`https://telegram.org{TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: text,
            parse_mode: "Markdown",
          }),
        });
      } catch (tgError) {
        console.error("Не удалось отправить сообщение в Telegram:", tgError);
      }
    } else {
      console.warn("Пропущены переменные окружения BOT_TOKEN или ADMIN_CHAT_ID");
    }

    return NextResponse.json({ success: true, message: "Тикет создан, админ уведомлен" });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets:", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
