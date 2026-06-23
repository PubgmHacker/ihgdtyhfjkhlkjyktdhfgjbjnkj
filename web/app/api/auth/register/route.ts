import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existingUser = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existingUser) return NextResponse.json({ error: "User exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Автоматически подтверждаем все флаги верификации почты при создании аккаунта
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || "Покупатель",
        role: "USER",
        email_verified: new Date(),
        emailVerified: new Date(),
        is_verified: true,
        isVerified: true,
        created_at: new Date(),
        createdAt: new Date(),
      } as any,
    });

    return NextResponse.json({ success: true, user: { id: user.id.toString(), email: user.email } });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
