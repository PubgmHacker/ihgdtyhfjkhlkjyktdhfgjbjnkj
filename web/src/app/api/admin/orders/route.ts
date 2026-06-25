import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/orders — list all orders
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

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

// PATCH /api/admin/orders — update order status/tracking
export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

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