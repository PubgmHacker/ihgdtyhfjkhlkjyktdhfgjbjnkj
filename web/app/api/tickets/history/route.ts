import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

(BigInt.prototype as any).toJSON = function () { return this.toString(); };

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    if (!telegramId) return NextResponse.json({ tickets: [] });

    const tgId = BigInt(telegramId);

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: tgId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        category: t.category,
        message: t.message,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (e: any) {
    console.error("[tickets/history]", e);
    return NextResponse.json({ tickets: [] });
  }
}
