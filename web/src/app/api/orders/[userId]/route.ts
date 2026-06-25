import { NextRequest, NextResponse } from "next/server";
import { getOrdersForUser } from "@/lib/user-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const orders = await getOrdersForUser(userId);
  return NextResponse.json(orders);
}