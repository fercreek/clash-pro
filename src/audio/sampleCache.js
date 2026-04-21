import { SAMPLE_URLS } from './samples'
import { getCtx, getDestination } from './ctx'

const _buffers = {}
let _loading = false
let _loaded = false

export async function loadSamples() {
  if (_loaded || _loading) return
  _loading = true
  const ctx = getCtx()
  if (!ctx) { _loading = false; return }
  await Promise.all(
    Object.entries(SAMPLE_URLS).map(async ([id, url]) => {
      try {
        const resp = await fetch(url)
        const ab = await resp.arrayBuffer()
        _buffers[id] = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej))
      } catch (e) {
        console.warn(`Sample failed: ${id}`, e)
      }
    })
  )
  _loaded = true
  _loading = false
}

export function getBuffer(id) { return _buffers[id] ?? null }
export { getDestination }
