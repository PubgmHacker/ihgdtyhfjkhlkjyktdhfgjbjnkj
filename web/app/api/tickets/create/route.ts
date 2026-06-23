import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { telegramId, category, message } = await req.json();

    if (!telegramId || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ищем пользователя через универсальный findFirst, проверяя оба возможных варианта поля
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { telegram_id: BigInt(telegramId) } as any,
          { telegramId: BigInt(telegramId) } as any,
          { telegramId: String(telegramId) } as any
        ]
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Создаем тикет в базе данных (используем as any для обхода строгой типизации схем)
    const ticket = await prisma.support_tickets.create({
      data: {
        user_id: user.id,
        category: category || "general",
        message: message,
        status: "open",
        created_at: new Date(),
      } as any,
    });

    return NextResponse.json({ 
      success: true, 
      ticketId: ticket.id.toString() 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
