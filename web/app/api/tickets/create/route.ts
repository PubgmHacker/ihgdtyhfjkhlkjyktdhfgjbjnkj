import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.telegram_id || body.telegramId || body.userId;

    if (!rawId) {
      return NextResponse.json({ error: "telegram_id обязателен" }, { status: 400 });
    }

    // Безопасно переводим в BigInt, убирая ошибку 500
    const tgId = BigInt(String(rawId).trim());

    // Ищем пользователя по корректному полю схемы Prisma
    let user = await prisma.user.findFirst({ where: { telegramId: tgId } });

    if (!user) {
      // Если пользователя нет, автоматически создаем его перед созданием заявки
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          name: body.name || `User_${tgId.toString().slice(0, 4)}`,
          username: body.username || null,
        },
      });
    }

    // Создаем тикет поддержки
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: tgId, // Привязка по BigInt telegram_id
        subject: body.subject || "Без темы",
        message: body.message || "",
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets:", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
