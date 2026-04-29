export function normalizeDancerNameKey(s) {
  if (typeof s !== 'string') return ''
  return s.trim().toLowerCase().normalize('NFC')
}

export function pickCanonicalRow(a, b, userId) {
  const tier = (r) => {
    if (!userId) return r.user_id ? 1 : 0
    if (r.user_id === userId) return 2
    return r.user_id ? 1 : 0
  }
  const ta = tier(a)
  const tb = tier(b)
  if (tb !== ta) return tb > ta ? b : a
  const fa = a.frequency_count ?? 0
  const fb = b.frequency_count ?? 0
  if (fb !== fa) return fb > fa ? b : a
  return String(a.id) < String(b.id) ? a : b
}

export function dedupeRosterByName(rows, userId) {
  const by = new Map()
  for (const r of rows) {
    const k = normalizeDancerNameKey(r.name)
    const cur = by.get(k)
    by.set(k, cur ? pickCanonicalRow(cur, r, userId) : r)
  }
  return [...by.values()]
}

export function dedupeRosterForViewerTable(rows, viewerUserId) {
  const by = new Map()
  for (const r of rows) {
    const nameK = normalizeDancerNameKey(r.name)
    if (!nameK) continue
    let key
    if (viewerUserId) {
      const foreign = r.user_id != null && r.user_id !== viewerUserId
      key = foreign ? `u:${r.user_id}:${nameK}` : nameK
    } else {
      key = `${r.user_id ?? 'null'}:${nameK}`
    }
    const cur = by.get(key)
    by.set(key, cur ? pickCanonicalRow(cur, r, viewerUserId) : r)
  }
  return [...by.values()]
}
