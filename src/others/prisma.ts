import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}
