import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const orders = await db.order.findMany({
      where: { status: { not: "cancelled" } },
      select: { items: true },
    });

    // Count product occurrences across all order items
    const countMap: Record<string, number> = {};
    for (const order of orders) {
      try {
        const items: Array<{ id?: string; name?: string; qty?: number }> =
          JSON.parse(order.items);
        for (const item of items) {
          if (item.id) {
            countMap[item.id] = (countMap[item.id] || 0) + (item.qty || 1);
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    // Sort by count descending, take top 4
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, count]) => ({ id, count }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Popular products error:", error);
    return NextResponse.json([], { status: 500 });
  }
}