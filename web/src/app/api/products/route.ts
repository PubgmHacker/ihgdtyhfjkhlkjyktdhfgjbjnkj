import { NextResponse } from "next/server";
import { allProducts } from "@/lib/products";

export async function GET() {
  return NextResponse.json({ products: allProducts });
}