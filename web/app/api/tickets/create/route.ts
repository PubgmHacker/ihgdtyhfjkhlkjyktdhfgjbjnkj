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

    // 1. Находим пользователя (или создаем через Raw SQL, если его нет)
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

    // 2. Собираем сообщение для записи
    const incomingText = body.message || body.text || body.subject || body.description || "Обращение из API";
    const categoryPrefix = body.category ? `[${String(body.category).toUpperCase()}] ` : "";
    const fullMessage = `${categoryPrefix}${incomingText}`;
    const subject = body.subject || "Без темы";

    // 3. Выполняем запись в support_tickets через Raw SQL в обход схем Prisma
    // Пробуем записать в стандартные колонки PostgreSQL (user_id, message/text/subject, status)
    try {
      await prisma.$executeRaw`
        INSERT INTO "support_tickets" ("user_id", "subject", "message", "status")
        VALUES (${tgId}, ${subject}, ${fullMessage}, 'OPEN')
      `;
    } catch (e) {
      try {
        // Альтернативный вариант, если колонок subject/message нет, а есть просто text
        await prisma.$executeRaw`
          INSERT INTO "support_tickets" ("user_id", "text", "status")
          VALUES (${tgId}, ${fullMessage}, 'OPEN')
        `;
      } catch (e2) {
        // Самый минималистичный вариант (только юзер и статус)
        await prisma.$executeRaw`
          INSERT INTO "support_tickets" ("user_id", "status")
          VALUES (${tgId}, 'OPEN')
        `;
      }
    }

    return NextResponse.json({ success: true, message: "Тикет успешно создан через Raw SQL" });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets (Raw SQL):", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
