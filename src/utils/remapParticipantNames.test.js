import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateEqualLengthRemap,
  remapMatches,
  remapPracticeState,
} from './remapParticipantNames.js'

test('validateEqualLengthRemap rechaza distinto N', () => {
  const r = validateEqualLengthRemap(['A', 'B'], ['A'])
  assert.equal(r.ok, false)
})

test('validateEqualLengthRemap acepta permutación', () => {
  const r = validateEqualLengthRemap(['Ana', 'Bea'], ['Bea', 'Ana'])
  assert.equal(r.ok, true)
  assert.equal(r.map.Ana, 'Bea')
  assert.equal(r.map.Bea, 'Ana')
})

test('remapMatches intercambia nombres en partidos', () => {
  const map = { Ana: 'Dora', Bea: 'Ana', Dora: 'Bea' }
  const m = [
    { id: 'm0', round: 1, playerA: 'Ana', playerB: 'Bea', isBye: false, isRepeat: false, completed: false, result: null },
  ]
  const out = remapMatches(m, map)
  assert.equal(out[0].playerA, 'Dora')
  assert.equal(out[0].playerB, 'Ana')
})

test('remapPracticeState mantiene ids y rondas', () => {
  const matches = [
    { id: 'match-0', round: 1, playerA: 'A', playerB: 'B', isBye: false, isRepeat: false, completed: true, result: null },
  ]
  const practiceIterations = [{ matches, stats: { appearances: {}, repeats: {}, pairs: [] } }]
  const map = { A: 'C', B: 'D' }
  const r = remapPracticeState({
    matches,
    competitorsAfter: ['C', 'D'],
    practiceIterations,
    practiceInitialRepeatCounts: { A: 1 },
    map,
  })
  assert.equal(r.matches[0].id, 'match-0')
  assert.equal(r.matches[0].round, 1)
  assert.equal(r.practiceInitialRepeatCounts.C, 1)
})
