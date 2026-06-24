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

    // Собираем весь текст из запроса в одну понятную строку
    const incomingText = body.message || body.text || body.subject || body.description || "Обращение из API";
    const categoryPrefix = body.category ? `[${String(body.category).toUpperCase()}] ` : "";
    const fullMessage = `${categoryPrefix}${incomingText}`;

    // 2. Создаем динамический объект данных
    const ticketData: any = {
      userId: tgId,
      status: "OPEN",
    };

    // 3. Безопасно маппим текст во все возможные варианты названий полей в Prisma
    const fields = prisma.supportTicket.fields;
    
    if ('message' in fields) ticketData.message = fullMessage;
    if ('text' in fields) ticketData.text = fullMessage;
    if ('subject' in fields) ticketData.subject = body.subject || "Без темы";
    if ('title' in fields) ticketData.title = body.subject || "Обращение";
    if ('description' in fields) ticketData.description = fullMessage;

    // 4. Создаем тикет поддержки
    const ticket = await prisma.supportTicket.create({
      data: ticketData,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Ошибка Create API Tickets:", error);
    return NextResponse.json({ error: error.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
