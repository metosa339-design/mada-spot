import { PrismaClient } from '@prisma/client';
import { serverEnv } from './env';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
// Uses connection pooling compatible with serverless (Neon, Vercel, etc.)
const prisma = global.__prisma || new PrismaClient({
  log: serverEnv.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasourceUrl: serverEnv.DATABASE_URL,
});

if (serverEnv.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { prisma };
export default prisma;
