import { describe, expect, it } from 'vitest'
import {
  assertEffortId, decideEffort, isEffortId, MIN_SAMPLE_FOR_DOWNGRADE, reasoningEffortSupported,
  resolveEffortInjection, toolDurationMs,
  type EffortDecisionInput, type EffortInjectionInput, type ToolCallSample, type ToolHistory,
} from '../src/thinking-level.ts'

/** One sampled window, as `recentToolCalls` returns it. */
const win = (calls: readonly ToolCallSample[], failed = false): ToolHistory => ({ calls, failed })

/** A deterministic-looking window, long enough to be judged. */
const routine = (length = MIN_SAMPLE_FOR_DOWNGRADE): ToolCallSample[] =>
  Array.from({ length }, (_, index) => ({ name: index % 2 === 0 ? 'bash' : 'fs_read', argsSize: 20 }))

const base = (over: Partial<EffortDecisionInput>): EffortDecisionInput => ({
  history: undefined,
  selected: 'high',
  allowDowngrade: true,
  allowUpgrade: true,
  ...over,
})

describe('manual levels pass through unchanged', () => {
  it('off disables thinking for any request', () => {
    expect(decideEffort(base({ selected: 'off' }))).toBe('off')
    expect(decideEffort(base({ history: win([{ name: 'bash', argsSize: 40 }]), selected: 'off' }))).toBe('off')
  })

  it('low is the manual pick for simple chat tasks, regardless of history', () => {
    expect(decideEffort(base({ selected: 'low' }))).toBe('low')
    expect(decideEffort(base({ history: win([{ name: 'web_search', argsSize: 2000 }]), selected: 'low' }))).toBe('low')
  })

  it('high and max fix the wire level', () => {
    expect(decideEffort(base({ selected: 'high' }))).toBe('high')
    expect(decideEffort(base({ selected: 'max' }))).toBe('max')
  })
})

describe('auto scheduler', () => {
  it('keeps a fresh prompt at the hub — a first step is not evidence of a cheap task', () => {
    // The first request of a session has no tool history, so there is nothing
    // to schedule FROM. The plan is made here; guessing low is paid for in
    // every later step, while guessing high costs part of one round.
    expect(decideEffort(base({ selected: 'auto', history: win([]) }))).toBe('high')
    expect(decideEffort(base({ selected: 'auto' }))).toBe('high')
  })

  it('sends simple deterministic tool chains to low', () => {
    expect(decideEffort(base({ selected: 'auto', history: win(routine()) }))).toBe('low')
  })

  it('keeps mixed or heavy tool chains at the high hub', () => {
    const history = win([
      { name: 'bash', argsSize: 40 },
      { name: 'web_search', argsSize: 900 },
      { name: 'mcp__db', argsSize: 300 },
    ])
    expect(decideEffort(base({ selected: 'auto', history }))).toBe('high')
  })

  it('lifts to max only for very heavy payloads when upgrades are allowed', () => {
    const history = win([{ name: 'mcp__docs', argsSize: 4000 }])
    expect(decideEffort(base({ selected: 'auto', history }))).toBe('max')
    expect(decideEffort(base({ selected: 'auto', history, allowUpgrade: false }))).toBe('high')
  })

  it('escalates on recent heft, not on the memory of it', () => {
    const heavy = { name: 'write', argsSize: 48000 }
    const light = (index: number) => ({ name: 'fs_read', argsSize: 40 + index })
    // The 48 KB write is the most recent call: this is the heavy work.
    expect(decideEffort(base({ selected: 'auto', history: win([light(1), light(2), heavy]) }))).toBe('max')
    // Seven light calls later the same payload is history, not signal — a full
    // 8-call window would keep escalating for the next eight requests.
    const aged = win([heavy, ...Array.from({ length: 7 }, (_, index) => light(index))])
    expect(decideEffort(base({ selected: 'auto', history: aged }))).toBe('low')
    expect(decideEffort(base({ selected: 'auto', history: aged, allowDowngrade: false }))).toBe('high')
  })

  it('will not downgrade a window too small to judge', () => {
    // One call is an event, not a pattern: a single read must not pin the
    // following step to the cheapest level.
    expect(decideEffort(base({ selected: 'auto', history: win([{ name: 'fs_read', argsSize: 12 }]) }))).toBe('high')
    expect(decideEffort(base({
      selected: 'auto',
      history: win(routine(MIN_SAMPLE_FOR_DOWNGRADE - 1)),
    }))).toBe('high')
    expect(decideEffort(base({ selected: 'auto', history: win(routine(MIN_SAMPLE_FOR_DOWNGRADE)) }))).toBe('low')
  })

  it('fails safe to the hub when the session log cannot be read', () => {
    // Cannot observe is not the same observation as "no tool calls happened".
    // The old code collapsed both into an empty window, which the scheduler
    // read as "simple chat" — the whole session then ran at the cheapest level.
    expect(decideEffort(base({ selected: 'auto', history: undefined }))).toBe('high')
  })

  it('floors a window that contains a failed tool round at the hub', () => {
    // A round that went wrong is not routine work, so it must not be downgraded
    // — but a failure is not evidence that maximal reasoning is needed either,
    // so it does not escalate to `max` on its own.
    expect(decideEffort(base({ selected: 'auto', history: win(routine(), true) }))).toBe('high')
    expect(decideEffort(base({ selected: 'auto', history: win(routine(), true), allowUpgrade: true }))).toBe('high')
    expect(decideEffort(base({ selected: 'auto', history: win(routine(), true), allowDowngrade: false }))).toBe('high')
  })

  it('still escalates a failed round that is also carrying a heavy recent payload', () => {
    const history = win([...routine(), { name: 'write', argsSize: 9000 }], true)
    expect(decideEffort(base({ selected: 'auto', history }))).toBe('max')
  })

  it('respects the downgrade toggle', () => {
    expect(decideEffort(base({ selected: 'auto', allowDowngrade: false }))).toBe('high')
    expect(decideEffort(base({ selected: 'auto', history: win(routine()), allowDowngrade: false }))).toBe('high')
  })

  it('never resolves to off or auto (scheduler output is a wire level)', () => {
    const samples = [
      base({ selected: 'auto' }),
      base({ selected: 'auto', history: win([]) }),
      base({ selected: 'auto', history: win(routine()) }),
      base({ selected: 'auto', history: win(routine(), true), allowUpgrade: true }),
      base({ selected: 'auto', history: win([{ name: 'mcp__db', argsSize: 5000 }]), allowUpgrade: true }),
    ]
    for (const input of samples) {
      const out = decideEffort(input)
      expect(['low', 'high', 'max']).toContain(out)
    }
  })
})

describe('effort-level validation', () => {
  it('accepts the eight standard levels plus auto', () => {
    for (const level of ['off', 'on', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto']) {
      expect(isEffortId(level)).toBe(true)
      expect(() => assertEffortId(level, 'test')).not.toThrow()
    }
  })

  it('rejects out-of-band values that dsh would reject per request', () => {
    for (const bad of ['ultra', 'reasoning', 3, null, undefined, {}]) {
      expect(isEffortId(bad)).toBe(false)
      expect(() => assertEffortId(bad, 'test')).toThrow(TypeError)
    }
  })
})

describe('simple-tool classification boundary', () => {
  it('anchors on word boundaries so look-alike heavy tools are not misread as simple', () => {
    // fs_* and bash match; heavy look-alikes do not.
    const simpleCalls = [
      { name: 'fs_write', argsSize: 100 },
      { name: 'bash', argsSize: 40 },
      { name: 'fs_read', argsSize: 20 },
    ]
    expect(decideEffort(base({ selected: 'auto', history: win(simpleCalls) }))).toBe('low')
    const lookAlike = [
      { name: 'codebase_search', argsSize: 40 }, // starts with code but is a search-heavy tool
      { name: 'job_status_check', argsSize: 30 },
      { name: 'web_fetch', argsSize: 120 },
    ]
    expect(decideEffort(base({ selected: 'auto', history: win(lookAlike) }))).toBe('high')
  })
})

describe('toolDurationMs', () => {
  it('reports the wall-clock delta and never negative jitter', () => {
    expect(toolDurationMs(1000, 2400)).toBe(1400)
    expect(toolDurationMs(2400, 1000)).toBe(0)
  })
})

describe('reasoningEffortSupported', () => {
  it('accepts a reasoning metadata object with efforts', () => {
    expect(reasoningEffortSupported({ efforts: [{ id: 'off', name: 'Off' }, { id: 'low', name: 'Low' }] })).toBe(true)
  })

  it('rejects absent, empty, and malformed reasoning metadata', () => {
    expect(reasoningEffortSupported(undefined)).toBe(false)
    expect(reasoningEffortSupported(null)).toBe(false)
    expect(reasoningEffortSupported({})).toBe(false)
    expect(reasoningEffortSupported({ efforts: [] })).toBe(false)
    expect(reasoningEffortSupported({ efforts: 'off' })).toBe(false)
  })
})

describe('resolveEffortInjection — model capability guard', () => {
  const FULL_EFFORTS = ['off', 'low', 'high', 'max', 'auto']
  const inject = (over: Partial<EffortInjectionInput>): EffortInjectionInput => ({
    supportsReasoning: true,
    seedEffort: undefined,
    selected: 'auto',
    history: undefined,
    allowDowngrade: true,
    allowUpgrade: true,
    efforts: FULL_EFFORTS,
    toggleOnly: false,
    ...over,
  })

  it('strips the effort entirely for a model without reasoning support', () => {
    // A custom openai-completions route (e.g. Qwen3.6 without reasoningEfforts)
    // must never receive a reasoning_effort: dsh rejects it per request.
    const decision = resolveEffortInjection(inject({ supportsReasoning: false, seedEffort: 'low', selected: 'low' }))
    expect(decision).toEqual({ inject: false })
  })

  it('passes a manual low selection through unchanged on a supporting model', () => {
    // dsh rc.7+ advertises low natively; the plugin neither rewrites it nor
    // re-schedules it.
    expect(resolveEffortInjection(inject({ seedEffort: 'low' }))).toEqual({ inject: true, level: 'low' })
    expect(resolveEffortInjection(inject({ seedEffort: 'max' }))).toEqual({ inject: true, level: 'max' })
  })

  it('resolves auto through the scheduler, which may still pick low', () => {
    // The capability guard already stripped unsupported models, so a scheduled
    // low only reaches models that advertise it.
    expect(resolveEffortInjection(inject({ seedEffort: undefined, history: win(routine()) })))
      .toEqual({ inject: true, level: 'low' })
    const heavy = win([{ name: 'mcp__docs', argsSize: 4000 }])
    expect(resolveEffortInjection(inject({ seedEffort: 'auto', history: heavy }))).toEqual({ inject: true, level: 'max' })
  })

  it('keeps an unreadable session at the hub rather than at low', () => {
    expect(resolveEffortInjection(inject({ seedEffort: undefined, history: undefined })))
      .toEqual({ inject: true, level: 'high' })
  })

  it('falls back to the configured default when the seed carries no effort', () => {
    expect(resolveEffortInjection(inject({ seedEffort: undefined, selected: 'high' }))).toEqual({ inject: true, level: 'high' })
  })

  it('clamps a scheduled low to the model’s highest thinking level', () => {
    // A model advertising no low (e.g. off/minimal/max) lifts a scheduled low
    // to its highest thinking level instead of erroring.
    const narrow = { efforts: ['off', 'minimal', 'max'], toggleOnly: false }
    expect(resolveEffortInjection(inject({ ...narrow, seedEffort: undefined, history: win(routine()) })))
      .toEqual({ inject: true, level: 'max' })
  })

  it('strips an unsupported manual pick instead of clamping it', () => {
    // A manual low on a model that advertises no low is the user asking for an
    // exact level the API cannot take; the request must not fail per-round.
    expect(resolveEffortInjection(inject({ efforts: ['off', 'high', 'max'], seedEffort: 'low' })))
      .toEqual({ inject: false })
  })

  it('toggle-only Off injects the off level (providers map it to thinking disabled)', () => {
    const toggle = { efforts: ['off', 'high'], toggleOnly: true }
    expect(resolveEffortInjection(inject({ ...toggle, seedEffort: 'off' }))).toEqual({ inject: true, level: 'off' })
  })

  it('toggle-only On injects high (the explicit thinking-on signal)', () => {
    // `on` / any non-off seed on a toggle-only model injects `high` — the
    // advertised toggle level. The short-circuit adapter serializes a non-off
    // effort as enable_thinking true; an absent effort is ambiguous (some
    // gateways treat it as off), so the explicit signal is required.
    const toggle = { efforts: ['off', 'high'], toggleOnly: true }
    expect(resolveEffortInjection(inject({ ...toggle, seedEffort: 'on' }))).toEqual({ inject: true, level: 'high' })
    expect(resolveEffortInjection(inject({ ...toggle, seedEffort: 'high' }))).toEqual({ inject: true, level: 'high' })
    expect(resolveEffortInjection(inject({ ...toggle, seedEffort: undefined }))).toEqual({ inject: true, level: 'high' })
  })

  it('a stray On on an effort-capable model is stripped, never lifted', () => {
    // An effort-capable model advertises no `on`: a stray manual pick is
    // stripped, not lifted to high.
    expect(resolveEffortInjection(inject({ efforts: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'on' })))
      .toEqual({ inject: false })
  })

  it('passes the extended wire levels through when the model advertises them', () => {
    // A custom gateway may declare minimal / medium / xhigh in reasoningEfforts;
    // the manual pick then passes through unchanged (custom wire mapping).
    expect(resolveEffortInjection(inject({ efforts: ['off', 'minimal', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'medium' })))
      .toEqual({ inject: true, level: 'medium' })
    expect(resolveEffortInjection(inject({ efforts: ['off', 'minimal', 'medium', 'high', 'xhigh', 'max'], seedEffort: 'xhigh' })))
      .toEqual({ inject: true, level: 'xhigh' })
  })
})
