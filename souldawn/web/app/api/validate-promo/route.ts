import { NextRequest, NextResponse } from "next/server";
import { applyPromo } from "@/lib/pricing";

/**
 * POST /api/validate-promo — локальная валидация промокода (без прокси на бот).
 * Ожидает { code, total } — total в копейках.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const total = Number(body?.total || 0);
  const result = applyPromo(body?.code || "", total);
  if (!result.valid && result.error === "Введите промокод") {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
