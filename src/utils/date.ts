// Accepts: "2025/2", "2025/02", "202502" → stores as "2025/02"
export function normalizePublishedDate(input: string): string | null {
  const s = input.trim()
  if (!s) return null

  const slashMatch = s.match(/^(\d{4})\/(\d{1,2})$/)
  if (slashMatch) {
    const month = parseInt(slashMatch[2], 10)
    if (month >= 1 && month <= 12) return `${slashMatch[1]}/${String(month).padStart(2, '0')}`
  }

  const compactMatch = s.match(/^(\d{4})(\d{2})$/)
  if (compactMatch) {
    const month = parseInt(compactMatch[2], 10)
    if (month >= 1 && month <= 12) return `${compactMatch[1]}/${String(month).padStart(2, '0')}`
  }

  return s
}

// "2025/02" → "2025/2"
export function displayPublishedDate(stored: string): string {
  const match = stored.match(/^(\d{4})\/0?(\d{1,2})$/)
  return match ? `${match[1]}/${match[2]}` : stored
}
