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

    // 1. Находим пользователя или создаем через Raw SQL
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

    // 2. Пишем в базу данных
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

    // 3. ОТПРАВКА УВЕДОМЛЕНИЯ В TELEGRAM БОТУ (Пинок боту через HTTP)
    try {
      // Замените localhost:8080 на реальный внутренний хост вашего бота в Railway, если они в одной сети
      const BOT_SERVER_URL = process.env.BOT_SERVER_URL || "http://localhost:8080/webhook/new_ticket";
      
      await fetch(BOT_SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: tgId.toString(),
          message: fullMessage,
          subject: subject
        }),
      });
    } catch (botError) {
      console.error("Бот выключен или недоступен для уведомлений:", botError);
      // Не прерываем ответ клиенту, даже если бот не ответил
    }

    return NextResponse.json({ success: true, message: "Тикет создан" });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets (Raw SQL):", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
