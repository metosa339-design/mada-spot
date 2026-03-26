// Duplicate Detection: find similar establishments by name + city + type

import { prisma } from '@/lib/db'

interface DuplicatePair {
  a: { id: string; name: string; city: string; type: string }
  b: { id: string; name: string; city: string; type: string }
  score: number
}

/**
 * Normalize a string for comparison: lowercase, remove accents, trim
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Tokenize a string into words
 */
function tokenize(s: string): Set<string> {
  return new Set(normalize(s).split(/\s+/).filter(t => t.length > 1))
}

/**
 * Jaccard similarity between two sets (0-1)
 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return intersection.size / union.size
}

/**
 * Check if one string contains the other (substring match)
 */
function substringMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  return na.includes(nb) || nb.includes(na)
}

/**
 * Calculate similarity between two establishment names (0-1)
 */
export function similarity(a: string, b: string): number {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)
  const jaccardScore = jaccard(tokensA, tokensB)
  const isSubstring = substringMatch(a, b) ? 0.3 : 0
  return Math.min(1, jaccardScore + isSubstring)
}

/**
 * Find duplicate establishment pairs across the database
 */
export async function findDuplicates(threshold = 0.7): Promise<DuplicatePair[]> {
  const establishments = await prisma.establishment.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true, city: true, type: true },
    orderBy: { city: 'asc' },
  })

  const duplicates: DuplicatePair[] = []

  // Group by (city, type) to reduce comparison space
  const groups = new Map<string, typeof establishments>()
  for (const est of establishments) {
    const key = `${normalize(est.city)}|${est.type}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(est)
  }

  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const score = similarity(group[i].name, group[j].name)
        if (score >= threshold) {
          duplicates.push({
            a: group[i],
            b: group[j],
            score: Math.round(score * 100) / 100,
          })
        }
      }
    }
  }

  // Sort by similarity score descending
  duplicates.sort((a, b) => b.score - a.score)
  return duplicates
}
