import { NextResponse } from 'next/server';

// GET /api/push/vapid-key - Return the public VAPID key (no auth needed)
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  return NextResponse.json({ publicKey });
}
