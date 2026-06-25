import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const CODE_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MS = 60_000; // 1 minute between sends

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
    }

    // Rate limit: check last code sent
    const lastCode = await db.emailVerification.findFirst({
      where: { email: normalized },
      orderBy: { createdAt: "desc" },
    });

    if (lastCode) {
      const elapsed = Date.now() - lastCode.createdAt.getTime();
      if (elapsed < RATE_LIMIT_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Повторная отправка через ${waitSec} сек` },
          { status: 429 }
        );
      }
    }

    // Invalidate all previous codes for this email
    await db.emailVerification.updateMany({
      where: { email: normalized, used: false },
      data: { used: true },
    });

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000);

    await db.emailVerification.create({
      data: {
        email: normalized,
        code,
        expiresAt,
      },
    });

    // Send email
    const result = await sendVerificationEmail(normalized, code);

    if (!result.sent) {
      return NextResponse.json(
        { error: "Не удалось отправить письмо. Попробуйте позже." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresIn: CODE_EXPIRY_MINUTES * 60,
      devMode: result.fallback || undefined,
    });
  } catch (err) {
    console.error("[send-code]", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}