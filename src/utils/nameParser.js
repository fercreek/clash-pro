/**
 * Parsea una cadena libre y extrae nombres.
 * Splitters: coma, punto y coma, newline, tab.
 * Trim, filtro vacíos, dedupe case-insensitive (primer caso gana para casing).
 */
export function parseNames(str) {
  if (!str || typeof str !== 'string') return []

  const parts = str
    .split(/[,;\n\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const seen = new Set()
  const out = []
  for (const name of parts) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}
