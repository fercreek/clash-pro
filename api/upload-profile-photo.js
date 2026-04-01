import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(JSON.parse(raw || '{}'))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY

  if (!token) {
    res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN no configurado en Vercel' })
    return
  }
  if (!url || !anon) {
    res.status(500).json({ error: 'Supabase env faltante' })
    return
  }

  const authHeader = req.headers.authorization || ''
  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!accessToken) {
    res.status(401).json({ error: 'Sin sesión' })
    return
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    res.status(400).json({ error: 'JSON inválido' })
    return
  }

  const { imageBase64, contentType } = body
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'Falta imageBase64' })
    return
  }

  const mime = typeof contentType === 'string' && /^image\/(jpeg|jpg|png|webp|gif)$/i.test(contentType)
    ? contentType.replace('image/jpg', 'image/jpeg')
    : 'image/jpeg'

  let buffer
  try {
    buffer = Buffer.from(imageBase64, 'base64')
  } catch {
    res.status(400).json({ error: 'Base64 inválido' })
    return
  }

  const maxBytes = 2 * 1024 * 1024
  if (buffer.length > maxBytes) {
    res.status(400).json({ error: 'Máximo 2 MB' })
    return
  }

  const supabaseAnon = createClient(url, anon)
  const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(accessToken)
  const user = userData?.user
  if (userErr || !user) {
    res.status(401).json({ error: 'Sesión inválida' })
    return
  }

  const supabaseAuth = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg'
  const pathname = `profile-photos/${user.id}/${Date.now()}.${ext}`

  let uploaded
  try {
    uploaded = await put(pathname, buffer, {
      access: 'public',
      contentType: mime,
      token,
    })
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Error al subir' })
    return
  }

  const { error: upErr } = await supabaseAuth
    .from('profiles')
    .update({ photo_url: uploaded.url })
    .eq('id', user.id)

  if (upErr) {
    res.status(500).json({ error: upErr.message })
    return
  }

  res.status(200).json({ url: uploaded.url })
}
