import { NextRequest, NextResponse } from "next/server";
import type { OrderItem, Contact } from "@/lib/types";
import { verifyToken, ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { createPendingOrder } from "@/lib/orders";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || "";
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || "";
const YOOKASSA_RETURN_URL =
  process.env.YOOKASSA_RETURN_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

/**
 * POST /api/create-payment
 * Создаёт платёж YooKassa И сохраняет заказ в БД (status=pending, yookassaId).
 * Заказ привязывается к пользователю по куке, если он авторизован.
 * total — в рублях (как считает фронт); в БД сохраняем копейки.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, contact, payment_method } = body as {
      items: OrderItem[];
      total: number;
      contact: Contact;
      payment_method?: string;
    };

    if (!items || !items.length) {
      return NextResponse.json({ error: "Нет товаров в заказе" }, { status: 400 });
    }
    if (!contact?.phone) {
      return NextResponse.json({ error: "Укажи телефон" }, { status: 400 });
    }
    if (!total || total <= 0) {
      return NextResponse.json({ error: "Некорректная сумма" }, { status: 400 });
    }
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: "Оплата не настроена. Свяжитесь с поддержкой." },
        { status: 503 }
      );
    }

    const desc =
      items.length === 1
        ? `${items[0].name} (${items[0].size})`
        : `SOULDAWN — ${items.length} товаров`;

    const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");
    const idempotencyKey = `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const yooRes = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        "Idempotence-Key": idempotencyKey,
      },
      body: JSON.stringify({
        amount: { value: total.toFixed(2), currency: "RUB" },
        capture: true,
        description: desc,
        confirmation: { type: "redirect", return_url: YOOKASSA_RETURN_URL },
        metadata: {
          items: JSON.stringify(items),
          contact: JSON.stringify(contact),
          source: "website",
        },
      }),
    });

    const yooData = await yooRes.json();

    if (!yooRes.ok) {
      console.error("YooKassa error:", yooData);
      return NextResponse.json(
        { error: yooData.description || "Ошибка платёжной системы" },
        { status: 400 }
      );
    }

    if (yooData.status !== "pending" || !yooData.confirmation?.confirmation_url) {
      return NextResponse.json({ error: "Не удалось создать платёж" }, { status: 500 });
    }

    // Привязка к пользователю по куке (если авторизован).
    const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || "";
    const payload = token ? verifyToken(token) : null;
    const userId = payload?.userId ?? null;

    // Сохраняем заказ в БД (копейки). Цены позиций — в копейках.
    const itemsKopecks = items.map((it) => ({
      id: it.id,
      name: it.name,
      size: it.size,
      qty: it.qty,
      price: Math.round(it.price * 100),
    }));
    try {
      await createPendingOrder({
        userId,
        items: itemsKopecks,
        totalKopecks: Math.round(total * 100),
        yookassaId: yooData.id,
        contact,
      });
    } catch (e) {
      console.error("create-payment: failed to persist order", e);
      // Платёж уже создан — не блокируем пользователя, webhook дооформит по yookassaId.
    }

    return NextResponse.json({
      confirmation_url: yooData.confirmation.confirmation_url,
      payment_id: yooData.id,
    });
  } catch (error) {
    console.error("Payment API error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
