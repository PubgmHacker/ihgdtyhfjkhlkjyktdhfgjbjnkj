import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json({ error: "Telegram ID required" }, { status: 400 });
    }

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

    // Забираем все запросы этого пользователя
    const tickets = await prisma.support_tickets.findMany({
      where: { user_id: user.id } as any,
      orderBy: { created_at: "desc" } as any,
    });

    // Форматируем в валидный JSON
    const formattedTickets = tickets.map((t: any) => ({
      id: t.id.toString(),
      category: t.category,
      message: t.message,
      status: t.status,
      createdAt: t.created_at || t.createdAt,
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
