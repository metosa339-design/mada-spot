import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const healthy = dbStatus === 'ok';

  return Response.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      db: dbStatus,
      uptime: Math.floor(process.uptime()),
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
