import { describe, expect, it } from 'vitest'
import { recentToolCalls, TOOL_SAMPLE_WINDOW, toolSampleOf } from '../src/session-events.ts'
import { AUTO_SCHEDULE_KEY, readAutoSchedule } from '../src/auto-schedule-projection.ts'

/**
 * The legacy reader only ever sees data on host 0.1.0-rc.8: `session.events`
 * was removed from 0.1.2-rc.1 on (verified against dsh-v0.1.0-rc.8 vs
 * dsh-v0.1.2-rc.1). Every newer host is served by the `tlAutoSchedule`
 * projection instead, so these cases describe the ONE line this path still
 * covers — not the production path on current hosts.
 */
const toolCall = (name: string, argumentsText = '') => ({ type: 'tool/call', data: { name, arguments: argumentsText } })

describe('toolSampleOf — the single normalization point', () => {
  it('maps a real tool/call event onto a sample', () => {
    expect(toolSampleOf({ type: 'tool/call', data: { turn: 1, step: 1, callId: 'c', name: 'bash', arguments: 'echo hi' } }))
      .toEqual({ name: 'bash', argsSize: 7 })
  })

  it('returns undefined for anything else', () => {
    expect(toolSampleOf({ type: 'tool/result', data: {} })).toBeUndefined()
    expect(toolSampleOf({ type: 'tool/call' })).toBeUndefined()
    expect(toolSampleOf(null)).toBeUndefined()
  })
})

describe('recentToolCalls (legacy 0.1.0-rc.8 path)', () => {
  it('returns [] for a fresh prompt or unknown agent shapes', () => {
    expect(recentToolCalls(undefined)).toEqual([])
    expect(recentToolCalls(null)).toEqual([])
    expect(recentToolCalls('agent')).toEqual([])
    expect(recentToolCalls({})).toEqual([])
    expect(recentToolCalls({ session: {} })).toEqual([])
    expect(recentToolCalls({ session: { events: 'nope' } })).toEqual([])
  })

  it('extracts only tool/call events, oldest first', () => {
    const agent = {
      session: {
        events: [
          { type: 'user/message', data: {} },
          toolCall('bash', 'echo hi'),
          { type: 'tool/result', data: {} },
          toolCall('fs_read', 'x'.repeat(20)),
        ],
      },
    }
    expect(recentToolCalls(agent)).toEqual([
      { name: 'bash', argsSize: 7 },
      { name: 'fs_read', argsSize: 20 },
    ])
  })

  it('caps the sample window to the most recent calls', () => {
    const events = Array.from({ length: TOOL_SAMPLE_WINDOW + 5 }, (_, i) => toolCall(`tool_${i}`, `${i}`))
    const agent = { session: { events } }
    const samples = recentToolCalls(agent)
    expect(samples).toHaveLength(TOOL_SAMPLE_WINDOW)
    expect(samples[0].name).toBe(`tool_${5}`)
    expect(samples[samples.length - 1].name).toBe(`tool_${TOOL_SAMPLE_WINDOW + 4}`)
  })

  it('skips malformed records and defaults missing fields safely', () => {
    const agent = {
      session: {
        events: [
          { type: 'tool/call' }, // data missing
          { type: 'tool/call', data: null },
          { type: 'tool/call', data: { arguments: 42 } }, // name missing, args not a string
          { type: 'tool/call', data: { name: '', arguments: 'abc' } }, // empty name falls back
          { type: 'tool/call', data: { name: 'ok', arguments: undefined } },
        ],
      },
    }
    expect(recentToolCalls(agent)).toEqual([
      { name: 'tool', argsSize: 0 },
      { name: 'tool', argsSize: 3 },
      { name: 'ok', argsSize: 0 },
    ])
  })
})

/**
 * Decoy fixture — the regression lock for issue #6 bug 1.
 *
 * The object below is served BOTH ways at once: a stale `events` array holding
 * a single trivial call, and a projection holding three heavy ones. The
 * composed read (exactly what `src/index.ts` does) must return the projection's
 * samples. Anyone "fixing" the sampler by restoring the legacy fast path, or by
 * reordering the fallback, turns this red — which is precisely the false green
 * the original suite had (it asserted the array shape existed on hosts where it
 * does not).
 */
describe('sample source precedence (issue #6 regression lock)', () => {
  const composition = (ctx: { get?: (name: string) => unknown }, agent: unknown) => {
    const session = (agent as { session?: unknown } | undefined)?.session
    return readAutoSchedule(ctx, session)?.samples ?? recentToolCalls(agent)
  }

  const decoyAgent = () => ({
    session: {
      events: [toolCall('ls', '')],
    },
  })

  const projectionCtx = () => ({
    get: (name: string) => name === 'sessionProjections'
      ? {
        stateOf: (_session: unknown, key: string) => key === AUTO_SCHEDULE_KEY
          ? {
            samples: [
              { name: 'mcp__docs', argsSize: 4000 },
              { name: 'fs_write', argsSize: 900 },
              { name: 'bash', argsSize: 40 },
            ],
            userEffort: 'auto',
          }
          : undefined,
      }
      : undefined,
  })

  it('prefers the projection over a stale events array', () => {
    expect(composition(projectionCtx(), decoyAgent())).toEqual([
      { name: 'mcp__docs', argsSize: 4000 },
      { name: 'fs_write', argsSize: 900 },
      { name: 'bash', argsSize: 40 },
    ])
  })

  it('falls back to the legacy array only where the projection is unavailable', () => {
    expect(composition({ get: () => undefined }, decoyAgent())).toEqual([{ name: 'ls', argsSize: 0 }])
    // 0.1.0-rc.8 registry: register present, stateOf absent.
    expect(composition({ get: () => ({ register: () => {} }) }, decoyAgent())).toEqual([{ name: 'ls', argsSize: 0 }])
  })

  it('yields [] (fresh prompt) when neither source is available', () => {
    expect(composition({ get: () => undefined }, { session: {} })).toEqual([])
  })
})
