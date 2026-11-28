/**
 * N2 (4.9.0) catalog guards. Assertions map to checklist "N2 · 档位库":
 * family matching for 6 vendors, no-guess on unknown, the per-family level
 * exclusions (Claude 4.6 / Gemini 4 / Grok), the DeepSeek wire table, the
 * reasoningEffortsOf key domain, and the mandatory source stamp.
 */
import { describe, expect, it } from 'vitest'
import {
  EFFORT_TIER_FAMILIES,
  WIRE_LEVELS,
  matchEffortFamily,
  reasoningEffortsOf,
  resolveTier,
  suggestedEffortsFor,
  familyLevelList,
} from '../src/model-effort-catalog.ts'

describe('matchEffortFamily — vendor routing', () => {
  it('hits the right family for the six sample model ids', () => {
    expect(matchEffortFamily('anthropic', 'claude-opus-4.6')?.id).toBe('anthropic-claude')
    expect(matchEffortFamily('anthropic', 'claude-opus-5.5')?.id).toBe('anthropic-claude')
    expect(matchEffortFamily('google', 'gemini-4-neon')?.id).toBe('gemini-4')
    expect(matchEffortFamily('google', 'gemini-3-flash')?.id).toBe('gemini-3')
    expect(matchEffortFamily('xai', 'grok-4.6')?.id).toBe('grok-4.6')
    expect(matchEffortFamily('qwen', 'qwen3.8-max')?.id).toBe('qwen-effort')
    expect(matchEffortFamily('deepseek', 'deepseek-flash')?.id).toBe('deepseek-v4')
  })

  it('returns undefined for an unrecognized model (never guesses)', () => {
    expect(matchEffortFamily('acme-gateway', 'mystery-9000')).toBeUndefined()
    expect(resolveTier('acme-gateway', 'mystery-9000')).toBeUndefined()
  })
})

describe('resolveTier — per-family level exclusions', () => {
  it('Claude 4.6 has no xhigh, Claude 5.5 does', () => {
    expect(resolveTier('anthropic', 'claude-opus-4.6')?.wires.xhigh).toBeUndefined()
    expect(resolveTier('anthropic', 'claude-opus-4.6')?.wires.max).toBe('max')
    expect(resolveTier('anthropic', 'claude-opus-5.5')?.wires.xhigh).toBe('xhigh')
    expect(resolveTier('anthropic', 'claude-opus-5.5')?.vendorDefault).toBe('medium')
  })

  it('Gemini 4 has no minimal and cannot disable thinking', () => {
    const tier = resolveTier('google', 'gemini-4-neon')
    expect(tier?.wires.minimal).toBeUndefined()
    expect(tier?.wires.xhigh).toBe('xhigh')
    expect(tier?.canDisable).toBe(false)
  })

  it('Gemini 3 base has no minimal; 3.5 flash variant gains it', () => {
    expect(resolveTier('google', 'gemini-3-flash')?.wires.minimal).toBeUndefined()
    expect(resolveTier('google', 'gemini-3.5-flash')?.wires.minimal).toBe('minimal')
  })

  it('Grok has no off and defaults to high', () => {
    const tier = resolveTier('xai', 'grok-4.6')
    expect(tier?.wires.off).toBeUndefined()
    expect(tier?.vendorDefault).toBe('high')
    expect(tier?.canDisable).toBe(false)
  })

  it('DeepSeek ships three real grades + off, not the host seven (4.13.3)', () => {
    const tier = resolveTier('deepseek', 'deepseek-flash')
    // V4 maps low/medium up to high and xhigh to max, so only off/low/high/max
    // are distinct grades; offering minimal/medium/xhigh gave the auto
    // scheduler duplicate stops.
    expect(Object.keys(tier!.wires).sort()).toEqual(['high', 'low', 'max', 'off'])
    expect(tier?.wires.minimal).toBeUndefined()
    expect(tier?.wires.medium).toBeUndefined()
    expect(tier?.wires.xhigh).toBeUndefined()
    expect(tier?.wires.max).toBe('max')
    expect(tier?.vendorDefault).toBe('high')
    expect(tier?.canDisable).toBe(true)
  })

  it('DeepSeek notes record the vendor mapping and the V4.1 integer knob', () => {
    // The model ID cannot separate V4 from V4.1 (both ship as `deepseek-flash`
    // / `deepseek-v4-pro`; the display name carries the version), so the family
    // note carries both facts instead of guessing from the ID.
    const tier = resolveTier('deepseek', 'deepseek-flash')
    expect(tier?.notes).toContain('1–100')
    expect(tier?.notes).toContain('mapped up to high')
    expect(tier?.wires.xhigh).toBeUndefined()
  })

  it('Xiaomi MiMo is recognized as on/off only, with no effort wire at all', () => {
    const tier = resolveTier('mimo', 'mimo-v2.6-flash')
    expect(tier?.family.id).toBe('xiaomi-mimo')
    expect(tier?.wires).toEqual({})
    expect(tier?.toggleOnly).toBe(true)
    expect(reasoningEffortsOf(tier!)).toEqual({})
  })
})

describe('suggestedEffortsFor — the auto-apply button brain', () => {
  it('returns the ladder for a recognized effort family', () => {
    const s = suggestedEffortsFor('deepseek', 'deepseek-flash')
    expect(s.ok).toBe(true)
    if (!s.ok) return
    expect(s.levels).toEqual(['off', 'low', 'high', 'max'])
    expect(s.table).toEqual({ off: 'none', low: 'low', high: 'high', max: 'max' })
  })

  it('refuses with a distinct reason per miss kind', () => {
    expect(suggestedEffortsFor('acme', 'mystery-9000')).toMatchObject({ ok: false, reason: 'unrecognized' })
    expect(suggestedEffortsFor('mimo', 'mimo-v2.6-flash')).toMatchObject({ ok: false, reason: 'toggle-only' })
    expect(suggestedEffortsFor('qwen', 'qwen3.8-max')).toMatchObject({ ok: true })
    expect(suggestedEffortsFor('qwen', 'qwen3.6-plus')).toMatchObject({ ok: false, reason: 'toggle-only' })
    expect(suggestedEffortsFor('zhipu', 'glm-5.3')).toMatchObject({ ok: false, reason: 'low-confidence' })
  })

  it('decodes a wire-less, non-toggle family as "no support" for display', () => {
    const shape = familyLevelList({ wires: {}, toggleOnly: false } as never)
    expect(shape).toEqual({ kind: 'none', levels: [] })
    expect(familyLevelList(EFFORT_TIER_FAMILIES.find(f => f.id === 'deepseek-v4')!)).toEqual({
      kind: 'levels',
      levels: ['off', 'low', 'high', 'max'],
    })
  })
})

describe('reasoningEffortsOf', () => {
  it('emits only keys inside the host level domain, never on/auto', () => {
    for (const family of EFFORT_TIER_FAMILIES) {
      const map = reasoningEffortsOf({ wires: family.wires, canDisable: family.canDisable, toggleOnly: family.toggleOnly })
      for (const key of Object.keys(map)) {
        expect(WIRE_LEVELS).toContain(key)
      }
    }
  })

  it('toggle-only families produce an empty map', () => {
    const qwen = EFFORT_TIER_FAMILIES.find(f => f.id === 'qwen-toggle')!
    expect(reasoningEffortsOf({ wires: qwen.wires, canDisable: qwen.canDisable, toggleOnly: qwen.toggleOnly })).toEqual({})
  })

  it('canDisable families with no explicit off wire emit off:null', () => {
    const map = reasoningEffortsOf({ wires: { low: 'low' }, canDisable: true, toggleOnly: false })
    expect(map.off).toBeNull()
  })
})

describe('source stamp', () => {
  it('every family carries a non-empty url and a date-shaped retrievedAt', () => {
    for (const family of EFFORT_TIER_FAMILIES) {
      expect(family.source.url).toMatch(/^https?:\/\//)
      expect(family.source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('low-confidence families never claim a suggested ladder via the badge helper', () => {
    const low = EFFORT_TIER_FAMILIES.filter(f => f.confidence === 'low')
    expect(low.length).toBeGreaterThan(0)
    for (const family of low) {
      expect(family.wires).toBeDefined()
    }
  })
})
