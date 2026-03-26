import { NextRequest, NextResponse } from 'next/server'

// Server-side Nominatim proxy — avoids CORS/browser restrictions
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      q,
      countrycodes: 'mg',
      limit: '15',
      addressdetails: '1',
      'accept-language': 'fr',
    })

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'MadaSpot/1.0 (contact@madaspot.mg)',
          'Accept-Language': 'fr',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      console.error('[GEOCODE] Nominatim error:', res.status, res.statusText)
      return NextResponse.json([])
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300' }, // cache 5 min
    })
  } catch (err) {
    console.error('[GEOCODE] Proxy error:', err)
    return NextResponse.json([])
  }
}
