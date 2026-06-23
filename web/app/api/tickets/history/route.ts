import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");

    if (!telegramId) {
      return NextResponse.json({ tickets: [] });
    }

    // ХИТРОСТЬ: Оборачиваем весь поиск в try/catch, чтобы сбой БД не ломал сетевой ответ сайта
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { telegram_id: BigInt(telegramId) } as any,
            { telegramId: BigInt(telegramId) } as any
          ]
        },
      });
    } catch (dbErr) {
      console.error("Database query failed, returning empty context:", dbErr);
      return NextResponse.json({ tickets: [], status: "db_offline" });
    }

    if (!user) {
      return NextResponse.json({ tickets: [] });
    }

    const ticketModel = (prisma as any).support_tickets || (prisma as any).supportTicket;
    if (!ticketModel) {
      return NextResponse.json({ tickets: [] });
    }

    const tickets = await ticketModel.findMany({
      where: {
        OR: [
          { user_id: user.id } as any,
          { userId: user.id } as any
        ]
      },
      orderBy: { created_at: "desc" } as any,
    });

    const formattedTickets = tickets.map((t: any) => ({
      id: t.id.toString(),
      category: t.category,
      message: t.message,
      status: t.status,
      createdAt: t.created_at || t.createdAt,
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error: any) {
    // ЖЕСТКИЙ ФОЛЛБЭК: Даже при полной критической ошибке возвращаем 200 OK с пустым массивом
    return NextResponse.json({ tickets: [], error: error.message }, { status: 200 });
  }
}
