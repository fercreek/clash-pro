let _ctx = null
let _compressor = null
let _master = null
let _busShaper = null

export function getCtx() {
  if (!_ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    _ctx = new Ctor()
    _busShaper = _ctx.createWaveShaper()
    _busShaper.curve = makeSoftLimitCurve(32)
    _busShaper.oversample = '2x'
    _compressor = _ctx.createDynamicsCompressor()
    _compressor.threshold.value = -20
    _compressor.knee.value = 8
    _compressor.ratio.value = 2.2
    _compressor.attack.value = 0.0015
    _compressor.release.value = 0.2
    _master = _ctx.createGain()
    _master.gain.value = 0.82
    _compressor.connect(_busShaper)
    _busShaper.connect(_master)
    _master.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {})
  return _ctx
}

function makeSoftLimitCurve(n) {
  const c = new Float32Array(2 * n + 1)
  for (let i = 0; i < 2 * n + 1; i++) {
    const x = (i - n) / n
    c[i] = 0.95 * (x / (1 + 0.35 * x * x))
  }
  return c
}

export function getDestination() {
  getCtx()
  return _compressor ?? _ctx?.destination ?? null
}
