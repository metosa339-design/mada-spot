// Anti-Contournement: scan messages for phone numbers, WhatsApp mentions, emails

interface ScanMatch {
  type: 'phone' | 'whatsapp' | 'email'
  value: string
}

// Malagasy phone: +261 3X XXXXXXX or 03X XXXXXXX (with optional spaces/dashes)
const PHONE_PATTERNS = [
  /(?:\+?261|0)\s*[-.)]?\s*3[2-48]\s*[-.]?\s*\d\s*[-.]?\s*\d{2}\s*[-.]?\s*\d{2}\s*[-.]?\s*\d{1,2}/g,
  /(?:\+?261|0)\s*3[2-48]\s*\d{7}/g,
  // Catch "zero trente-deux" style patterns
  /0\s*3\s*[2-48]\s+\d{2}\s+\d{3}\s+\d{2}/g,
]

const WHATSAPP_PATTERNS = [
  /whats?\s*app/gi,
  /wa\.me/gi,
  /watsap/gi,
  /whattsapp/gi,
  /watsapp/gi,
]

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/**
 * Scan a message for contact info that bypasses the platform
 */
export function scanMessage(content: string): ScanMatch[] {
  const matches: ScanMatch[] = []
  const seen = new Set<string>()

  // Scan for phone numbers
  for (const pattern of PHONE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(content)) !== null) {
      const value = match[0].replace(/\s+/g, '').replace(/[-.)]/g, '')
      if (!seen.has(value)) {
        seen.add(value)
        matches.push({ type: 'phone', value: match[0].trim() })
      }
    }
  }

  // Scan for WhatsApp mentions
  for (const pattern of WHATSAPP_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    const match = regex.exec(content)
    if (match && !seen.has('whatsapp')) {
      seen.add('whatsapp')
      matches.push({ type: 'whatsapp', value: match[0] })
    }
  }

  // Scan for email addresses
  const emailRegex = new RegExp(EMAIL_PATTERN.source, EMAIL_PATTERN.flags)
  let emailMatch
  while ((emailMatch = emailRegex.exec(content)) !== null) {
    const value = emailMatch[0].toLowerCase()
    if (!seen.has(value)) {
      seen.add(value)
      matches.push({ type: 'email', value: emailMatch[0] })
    }
  }

  return matches
}
