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

    // 1. Находим или создаем пользователя
    let user = await prisma.user.findFirst({ where: { telegramId: tgId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          name: body.name || `User_${tgId.toString().slice(0, 4)}`,
          username: body.username || null,
        },
      });
    }

    // 2. Формируем тему, безопасно подмешивая категорию, если автотест её прислал
    const computedSubject = body.subject 
      ? String(body.subject) 
      : body.category 
        ? `[${String(body.category).toUpperCase()}] Обращение` 
        : "Без темы";

    // 3. Создаем тикет поддержки (БЕЗ использования поля category в объекте)
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: tgId,
        subject: computedSubject,
        message: body.message || "Обращение из API",
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets:", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
