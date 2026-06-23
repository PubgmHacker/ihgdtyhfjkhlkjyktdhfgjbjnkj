import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const existingUser = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existingUser) return NextResponse.json({ error: "User already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ИСПОЛЬЗУЕМ ТОЧНЫЕ ИЗВЕСТНЫЕ ПОЛЯ ИЗ ВАШЕЙ PRISMA SCHEMA ЛОГОВ
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        fullName: name || "Покупатель",
        role: "USER",
        isActive: true,
        lastLogin: new Date()
      } as any,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id.toString(), email: user.email, name: user.fullName }
    });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
