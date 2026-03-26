import { NextRequest, NextResponse } from 'next/server'

// Server-side reverse geocoding proxy
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lon = request.nextUrl.searchParams.get('lon')
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'MadaSpot/1.0 (contact@madaspot.mg)',
          'Accept-Language': 'fr',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      return NextResponse.json({})
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return NextResponse.json({})
  }
}
