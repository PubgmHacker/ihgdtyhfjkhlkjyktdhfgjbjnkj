import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, trackingCode } = body;

    if (!id) {
      return NextResponse.json({ error: "ID заказа обязателен" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
    if (status === "paid") updateData.paidAt = new Date();

    const order = await db.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}