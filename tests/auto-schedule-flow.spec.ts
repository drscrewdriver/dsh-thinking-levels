import { describe, expect, it } from 'vitest'
import { AUTO_SCHEDULE_KEY, applyAutoSchedule, readAutoSchedule, requestedEffortOf, type AutoScheduleState } from '../src/auto-schedule-projection.ts'
import { resolveEffortInjection, type EffortId } from '../src/thinking-level.ts'

/**
 * End-to-end simulation of the `agent/request` handler without cordis: the
 * projection is advanced by hand, the host echo is reproduced faithfully, and
 * the injected level is fed back as the next request's seed — the exact loop
 * that froze `auto` after the first request (issue #6, bug 2).
 *
 * This is the automatable form of the runtime proof: `calls` must rise with tool
 * activity and `auto` must keep scheduling on request #2 and #3.
 */
const EFFORTS = ['off', 'low', 'high', 'max', 'auto']
const HEAVY = [{ name: 'mcp__docs', argsSize: 4000 }]

interface Host {
  state: AutoScheduleState
  /** `request/header` = what the host persists, i.e. this plugin's own output. */
  lastHeaderEffort?: string
}

const makeHost = (): Host => ({ state: { samples: [], userEffort: null } })

/** Fold events the way the host registry would, before the request is prepared. */
const fold = (host: Host, ...events: unknown[]): void => {
  for (const event of events) host.state = applyAutoSchedule(host.state, event)
}

const selection = (reasoningEffort?: string) => ({
  type: 'model/selection',
  data: { provider: 'deepseek-account', model: 'deepseek-flash', ...(reasoningEffort === undefined ? {} : { reasoningEffort }) },
})

/** One `agent/request`, mirroring src/index.ts (minus capability resolution). */
const request = (host: Host, configLevel: EffortId) => {
  const requested = requestedEffortOf(host.state, configLevel)
  const decision = resolveEffortInjection({
    supportsReasoning: true,
    requested,
    seedEffort: host.lastHeaderEffort,
    recentCalls: host.state.samples,
    allowDowngrade: true,
    allowUpgrade: true,
    efforts: EFFORTS,
    toggleOnly: false,
  })
  // buildRequest persists the post-waterfall config into request/header.
  host.lastHeaderEffort = decision.level
  return decision
}

describe('auto schedule across a session (issue #6 end to end)', () => {
  it('keeps scheduling after the first request instead of freezing on the echo', () => {
    const host = makeHost()
    fold(host, selection('auto'))

    // Request #1 — fresh prompt, no tool calls yet: the scheduler picks low.
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })

    // The host now echoes `low` back as the seed. Before the fix this looked
    // like a manual pick and the level stayed low for the rest of the session.
    expect(host.lastHeaderEffort).toBe('low')

    // Request #2 — light tool activity, still low.
    fold(host, { type: 'tool/call', data: { name: 'bash', arguments: 'ls' } })
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })

    // Request #3 — a heavy MCP payload must now lift the level to max, i.e.
    // `allowUpgrade` is finally exercised and the sampler is not empty.
    fold(host, { type: 'tool/call', data: { name: 'mcp__docs', arguments: 'x'.repeat(4000) } })
    expect(host.state.samples).toHaveLength(2)
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'max' })

    // Request #4 — mixed/heavy history keeps the hub.
    fold(host, { type: 'tool/call', data: { name: 'bash', arguments: 'ls' } })
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'max' })
  })

  it('honours an explicit pick, and returns to scheduling when auto is re-picked', () => {
    const host = makeHost()
    fold(host, selection('auto'))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })

    // User picks high mid-session (only `model/selection` records this).
    fold(host, selection('high'))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'high' })
    fold(host, ...HEAVY.map(sample => ({ type: 'tool/call', data: { name: sample.name, arguments: 'x'.repeat(sample.argsSize) } })))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'high' })

    // Back to auto: the heavy history immediately lifts it again.
    fold(host, selection('auto'))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'max' })
  })

  it('does not let a manual pick equal to the echoed level get re-scheduled', () => {
    // The WeakMap-based patch failed exactly here: a manual `low` that happened
    // to equal the last injected level was mistaken for an echo. Folding
    // `model/selection` cannot confuse the two.
    const host = makeHost()
    fold(host, selection('auto'))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })
    fold(host, selection('low'))
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })
    // Heavy history must NOT lift the level while `low` is explicitly picked.
    fold(host, { type: 'tool/call', data: { name: 'mcp__docs', arguments: 'x'.repeat(4000) } })
    expect(request(host, 'auto')).toEqual({ inject: true, level: 'low' })
  })

  it('falls back to the configured level when the session never picked', () => {
    const host = makeHost()
    expect(request(host, 'high')).toEqual({ inject: true, level: 'high' })
  })

  it('reads the folded state through the registry when available', () => {
    const host = makeHost()
    fold(host, selection('auto'), { type: 'tool/call', data: { name: 'bash', arguments: 'ls' } })
    const ctx = { get: () => ({ stateOf: (_s: unknown, key: string) => (key === AUTO_SCHEDULE_KEY ? host.state : undefined) }) }
    expect(readAutoSchedule(ctx, {})?.userEffort).toBe('auto')
    expect(readAutoSchedule(ctx, {})?.samples).toEqual([{ name: 'bash', argsSize: 2 }])
  })
})
