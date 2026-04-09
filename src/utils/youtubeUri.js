const YT_STORAGE_KEY = 'clashpro:ytPlaylists:v1'

/**
 * Parsea una URL de YouTube y devuelve { type, id } o null.
 * Soporta:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/playlist?list=ID
 *  - https://www.youtube.com/watch?v=ID&list=ID  (preferencia a playlist)
 */
export function parseYouTubeUrl(input) {
  try {
    const url = new URL(input.trim())
    const listId  = url.searchParams.get('list')
    const videoId = url.searchParams.get('v')

    if (listId) return { type: 'playlist', id: listId }

    // youtu.be/ID
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace('/', '')
      if (id) return { type: 'video', id }
    }

    if (videoId) return { type: 'video', id: videoId }
  } catch {
    // URL inválida
  }
  return null
}

/**
 * Devuelve la URL de embed para el iframe de YouTube.
 */
export function buildEmbedUrl({ type, id }) {
  if (type === 'playlist') {
    return `https://www.youtube.com/embed?listType=playlist&list=${id}&autoplay=1&rel=0`
  }
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
}

export function loadYtPlaylists() {
  try {
    return JSON.parse(localStorage.getItem(YT_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveYtPlaylists(list) {
  try {
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(list))
  } catch {}
}
