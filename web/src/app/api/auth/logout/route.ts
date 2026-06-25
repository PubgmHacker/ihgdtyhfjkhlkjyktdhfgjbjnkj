import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", cookieOptions(0));
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", cookieOptions(0));
  return res;
}