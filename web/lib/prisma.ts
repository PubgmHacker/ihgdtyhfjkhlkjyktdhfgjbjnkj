import { PrismaClient } from "@prisma/client";

// ГЛОБАЛЬНЫЙ ПАТЧ ЯДРА: Автоматическая сериализация BigInt для PostgreSQL
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
