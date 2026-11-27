/**
 * N6 (4.13.0) compaction-policy guards (checklist N6):
 * retain<threshold, ratio bounds, op path shape, only-edited rule, and the
 * unavailable probe result when the host has no `modelPolicies` surface.
 */
import { describe, expect, it } from 'vitest'
import { modelPoliciesOf, planCompactionPolicies } from '../src/client/compaction-policy.ts'

const models = [
  { provider: 'openrouter', model: 'grok-4.6' },
  { provider: 'openrouter', model: 'deepseek-v4-pro' },
]
const defaults = { thresholdRatio: 0.8, retainRatio: 0.16 }
const existing = [
  { provider: 'openrouter', model: 'grok-4.6', thresholdRatio: 0.8, retainRatio: 0.16 },
]

describe('planCompactionPolicies', () => {
  it('rejects retainRatio >= thresholdRatio with a readable error', () => {
    const r = planCompactionPolicies(models, existing, { 'openrouter/grok-4.6': { thresholdRatio: 0.5, retainRatio: 0.6 } }, defaults)
    expect(r.ops).toEqual([])
    expect(r.errors.join(' ')).toContain('retainRatio must be below thresholdRatio')
  })

  it('rejects an out-of-bounds ratio', () => {
    const r = planCompactionPolicies(models, existing, { 'openrouter/grok-4.6': { thresholdRatio: 1.4 } }, defaults)
    expect(r.ops).toEqual([])
    expect(r.errors.join(' ')).toContain('between 0 and 1')
    const r2 = planCompactionPolicies(models, existing, { 'openrouter/grok-4.6': { retainRatio: 0 } }, defaults)
    expect(r2.errors.join(' ')).toContain('between 0 and 1')
  })

  it('emits the correct op path shape for an edited field', () => {
    const r = planCompactionPolicies(models, existing, { 'openrouter/grok-4.6': { thresholdRatio: 0.6 } }, defaults)
    expect(r.ops).toHaveLength(1)
    expect(r.ops[0].path).toEqual(['modelPolicies', '0', 'thresholdRatio'])
    expect(r.ops[0].value).toBe(0.6)
    expect(r.ops[0].op).toBe('set')
  })

  it('only edited models appear; untouched models emit nothing', () => {
    const r = planCompactionPolicies(models, [...existing, { provider: 'openrouter', model: 'deepseek-v4-pro', thresholdRatio: 0.8, retainRatio: 0.2 }], { 'openrouter/grok-4.6': { thresholdRatio: 0.5 } }, defaults)
    expect(r.ops.every(op => op.path[1] === '0')).toBe(true)
    expect(r.ops).toHaveLength(1)
  })

  it('appends a new policy entry when the model has none yet', () => {
    const r = planCompactionPolicies(models, existing, { 'openrouter/deepseek-v4-pro': { thresholdRatio: 0.7, retainRatio: 0.1 } }, defaults)
    // provider/model/threshold/retain ops at the appended index (1).
    expect(r.ops.map(op => op.path[2])).toEqual(expect.arrayContaining(['provider', 'model', 'thresholdRatio', 'retainRatio']))
    expect(r.ops[0].path[1]).toBe('1')
  })

  it('returns unavailable when the host has no modelPolicies key', () => {
    expect(planCompactionPolicies(models, undefined, { 'openrouter/grok-4.6': { thresholdRatio: 0.6 } }, defaults)).toEqual({ unavailable: true, errors: [], ops: [] })
  })

  it('no-op when the value equals the current declaration', () => {
    const r = planCompactionPolicies(models, existing, { 'openrouter/grok-4.6': { thresholdRatio: 0.8 } }, defaults)
    expect(r.ops).toEqual([])
    expect(r.errors).toEqual([])
  })
})

describe('modelPoliciesOf', () => {
  it('reads the array from the user layer, undefined when absent', () => {
    expect(modelPoliciesOf({ user: { modelPolicies: [{ provider: 'a', model: 'b' }] } })).toHaveLength(1)
    expect(modelPoliciesOf({ user: {} })).toBeUndefined()
    expect(modelPoliciesOf(undefined)).toBeUndefined()
  })
})
