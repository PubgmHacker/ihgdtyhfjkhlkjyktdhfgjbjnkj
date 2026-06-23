import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя и НАМЕРТВО выставляем флаги подтверждения в true, убирая вечную загрузку ЛК
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

    return NextResponse.json({
      success: true,
      user: { id: user.id.toString(), email: user.email, name: user.name }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
