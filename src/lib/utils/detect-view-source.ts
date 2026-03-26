import { NextRequest } from 'next/server'

const VALID_SOURCES = ['search', 'direct', 'map', 'featured']

export function detectViewSource(request: NextRequest): string {
  // Query param takes precedence (e.g., links with ?ref=map)
  const ref = new URL(request.url).searchParams.get('ref')
  if (ref && VALID_SOURCES.includes(ref)) {
    return ref
  }

  const referer = request.headers.get('referer') || ''

  if (referer.includes('/bons-plans/carte')) return 'map'

  if (
    referer.includes('/bons-plans/hotels') ||
    referer.includes('/bons-plans/restaurants') ||
    referer.includes('/bons-plans/attractions') ||
    referer.includes('/bons-plans/prestataires') ||
    referer.includes('/search')
  ) return 'search'

  if (referer.includes('/bons-plans/offres')) return 'featured'

  return 'direct'
}
