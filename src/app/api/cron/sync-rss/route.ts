import { NextRequest, NextResponse } from 'next/server';

// RSS sync is disabled — blog content is now manually curated (tourism-only articles).
// The previous full implementation is preserved in git history.
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'RSS sync disabled — blog is now curated manually',
    totalSaved: 0,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
