let _ctx = null
let _compressor = null

export function getCtx() {
  if (!_ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    _ctx = new Ctor()
    _compressor = _ctx.createDynamicsCompressor()
    _compressor.threshold.value = -18
    _compressor.knee.value = 6
    _compressor.ratio.value = 4
    _compressor.attack.value = 0.003
    _compressor.release.value = 0.25
    _compressor.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {})
  return _ctx
}

export function getDestination() {
  getCtx()
  return _compressor ?? _ctx?.destination ?? null
}
