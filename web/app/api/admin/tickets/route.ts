import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Обогатить данными пользователя
    const enriched = await Promise.all(
      tickets.map(async (t) => {
        let user = null;
        if (t.userId) {
          user = await prisma.user.findFirst({
            where: { telegramId: t.userId },
            select: { fullName: true, username: true, telegramId: true },
          });
        }
        return {
          id: t.id,
          category: t.category,
          message: t.message,
          status: t.status,
          createdAt: t.createdAt,
          user: user
            ? {
                name: user.fullName || user.username || "Посетитель",
                username: user.username,
                telegramId: user.telegramId?.toString(),
              }
            : null,
        };
      })
    );

    return NextResponse.json({ tickets: enriched });
  } catch (e: any) {
    console.error("[admin/tickets]", e);
    return NextResponse.json({ tickets: [], error: e.message });
  }
}

// Ответ оператора на тикет с сайта
export async function POST(req: Request) {
  try {
    const { ticketId, message, operatorId } = await req.json();
    if (!ticketId || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Записать ответ оператора
    await prisma.actionLog.create({
      data: { ticketId, sender: "operator", message },
    });

    // Найти тикет и уведомить пользователя в TG
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    const botToken = process.env.SUPPORT_BOT_TOKEN || process.env.BOT_TOKEN;

    if (ticket && botToken && ticket.userId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ticket.userId.toString(),
          text: `💬 <b>Ответ оператора SOULDAWN:</b>\n\n${message}`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
