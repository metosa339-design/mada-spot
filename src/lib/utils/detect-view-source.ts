import { NextRequest } from 'next/server'

const VALID_SOURCES = ['search', 'direct', 'map', 'featured']

export function detectViewSource(request: NextRequest): string {
  // Query param takes precedence (e.g., links with ?ref=map)
  const ref = new URL(request.url).searchParams.get('ref')
  if (ref && VALID_SOURCES.includes(ref)) {
    return ref
  }

  const referer = request.headers.get('referer') || ''

  if (referer.includes('/carte')) return 'map'

  if (
    referer.includes('/hotels') ||
    referer.includes('/restaurants') ||
    referer.includes('/attractions') ||
    referer.includes('/prestataires') ||
    referer.includes('/search')
  ) return 'search'

  if (referer.includes('/offres')) return 'featured'

  return 'direct'
}
