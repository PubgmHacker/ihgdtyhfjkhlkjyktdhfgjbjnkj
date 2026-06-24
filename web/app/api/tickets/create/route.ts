import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { telegramId, category, message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Найти или создать пользователя
    let user = null;
    if (telegramId) {
      const tgId = BigInt(telegramId);
      user = await prisma.user.findFirst({ where: { telegramId: tgId } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: tgId,
            fullName: "Посетитель сайта",
            username: `web_${Date.now()}`,
          },
        });
      }
    }

    // Создать тикет
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user ? user.telegramId! : BigInt(0),
        category: category || "general",
        message: message.trim(),
        originalText: message.trim(),
        status: "open",
      },
    });

    // Записать первое сообщение в лог
    await prisma.actionLog.create({
      data: {
        ticketId: ticket.id,
        sender: "user",
        message: message.trim(),
      },
    });

    // Уведомить операторов в Telegram (ИСПРАВЛЕННЫЙ URL)
    const botToken = process.env.SUPPORT_BOT_TOKEN || process.env.BOT_TOKEN;
    const supportIds = (process.env.SUPPORT_CHAT_ID || "").split(",").map(s => s.trim()).filter(Boolean);

    if (botToken && supportIds.length > 0) {
      const text = `❓ <b>Новое обращение с сайта!</b>\n\n<b>Тикет:</b> <code>${ticket.id.slice(-8)}</code>\n<b>Категория:</b> ${category || "general"}\n<b>Сообщение:</b>\n${message.slice(0, 500)}`;
      const replyMarkup = {
        inline_keyboard: [[
          { text: "📥 Взять в работу", callback_data: `ticket:take:${ticket.id}` }
        ]]
      };

      for (const adminId of supportIds) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminId,
            text,
            parse_mode: "HTML",
            reply_markup: replyMarkup,
          }),
        }).catch((e) => console.error(`TG notify failed for ${adminId}:`, e));
      }
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (e: any) {
    console.error("[tickets/create]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
