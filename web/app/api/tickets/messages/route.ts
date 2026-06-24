import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты — ИИ-ассистент поддержки бренда одежды SOULDAWN. Отвечай кратко и по делу на вопросы о заказах, доставке, размерах, возврате.
Если пользователь просит оператора, хочет возврат, или ты не можешь помочь — ответь строго: [OPERATOR]`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    if (!ticketId) return NextResponse.json({ messages: [] });

    const logs = await prisma.actionLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages: logs });
  } catch (e: any) {
    console.error("[tickets/messages GET]", e);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { ticketId, sender, text } = await req.json();
    if (!ticketId || !text?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Записать сообщение пользователя
    await prisma.actionLog.create({
      data: { ticketId, sender: sender || "user", message: text.trim() },
    });

    // Если пишет пользователь — запустить ИИ или уведомить оператора
    if (sender === "user") {
      const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

      if (ticket?.status === "open") {
        const apiKey = process.env.OPENAI_API_KEY;
        let aiAnswer = "[OPERATOR]";

        if (apiKey) {
          try {
            const baseUrl = apiKey.startsWith("sk-or-")
              ? "https://openrouter.ai/api/v1"
              : "https://api.openai.com/v1";

            const aiRes = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash:free",
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: text.trim() },
                ],
              }),
            });
            const aiData = await aiRes.json();
            aiAnswer = aiData?.choices?.[0]?.message?.content?.trim() || "[OPERATOR]";
          } catch {
            aiAnswer = "[OPERATOR]";
          }
        }

        if (aiAnswer.includes("[OPERATOR]")) {
          // Эскалация — переключить на оператора
          await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: "operator" },
          });
          await prisma.actionLog.create({
            data: {
              ticketId,
              sender: "system",
              message: "🔄 Запрос передан оператору. Ожидайте ответа.",
            },
          });

          // Уведомить операторов (ИСПРАВЛЕННЫЙ URL)
          const botToken = process.env.SUPPORT_BOT_TOKEN || process.env.BOT_TOKEN;
          const supportIds = (process.env.SUPPORT_CHAT_ID || "").split(",").map(s => s.trim()).filter(Boolean);

          if (botToken && supportIds.length > 0) {
            const alertText = `👨‍💻 <b>Эскалация тикета!</b>\n\n<b>ID:</b> <code>${ticketId.slice(-8)}</code>\n<b>Вопрос:</b> <i>${text.slice(0, 300)}</i>`;
            const replyMarkup = {
              inline_keyboard: [[
                { text: "💬 Ответить", callback_data: `ticket:reply:${ticketId}` }
              ]]
            };
            for (const adminId of supportIds) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: adminId,
                  text: alertText,
                  parse_mode: "HTML",
                  reply_markup: replyMarkup,
                }),
              }).catch(() => {});
            }
          }
        } else {
          // ИИ ответил — записать
          await prisma.actionLog.create({
            data: { ticketId, sender: "ai", message: aiAnswer },
          });
        }
      } else if (ticket?.status === "operator" && ticket.acceptedBy) {
        // Тикет у оператора — уведомить его напрямую
        const botToken = process.env.SUPPORT_BOT_TOKEN || process.env.BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: ticket.acceptedBy.toString(),
              text: `💬 Новое сообщение (тикет #${ticketId.slice(-8)}):\n\n${text.slice(0, 500)}`,
            }),
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[tickets/messages POST]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
