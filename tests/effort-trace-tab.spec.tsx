/**
 * The conversation-view effort-trace tab: rows newest first with transition
 * glyphs derived from the escalation rank, the projection-face read path
 * (`traceOf` — undefined, never a throw, on any absent piece), and the render
 * degradation contract (empty state for a missing face / empty trace; a live
 * subscription updates the rows).
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { EffortTrace, summarize, traceOf, traceRows } from '../src/client/effort-trace.tsx'
import type { EffortRun } from '../src/auto-schedule-projection.ts'

const identity = (key: string): string => key

/**
 * A SessionsFace stub serving one fixed trace through the projection face.
 *
 * The snapshot object is CACHED, not rebuilt per call: the real
 * `ProjectionValueStore` hands out `rows.get(key)?.value` — one stable
 * reference until the row actually changes — and `useSyncExternalStore`
 * requires exactly that. A stub returning a fresh literal each call makes every
 * render look like a change and spins React forever.
 */
function sessionsWith(trace: readonly EffortRun[] | undefined, hooks?: { onSubscribe?: (listener: () => void) => void }): SessionsFace {
  const snapshot = { trace }
  const face = {
    // REAL host shape: the projection face's snapshot IS the state record
    // (`projection-store.ts:236` — `rows.get(key)?.value`), never `{ value }`.
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      hooks?.onSubscribe?.(listener)
      return () => {}
    },
  }
  return {
    scope: () => undefined,
    binding: () => ({
      session: { projections: { faceOf: (key: string) => (key === 'tlAutoSchedule' ? face : undefined) } },
    }),
  } as unknown as SessionsFace
}

/** Collect every text leaf of a rendered tree (order-preserving). */
function texts(node: unknown): string[] {
  const walk = (element: unknown): string[] => {
    if (element === null || element === undefined) return []
    const e = element as { type?: unknown; props?: { children?: unknown }; children?: unknown }
    if (typeof e === 'string') return [e]
    if (typeof e === 'number') return [String(e)]
    const own = e.children !== undefined ? e.children : e.props?.children
    if (Array.isArray(own)) return own.flatMap(walk)
    if (own === undefined || own === null) return []
    return walk(own)
  }
  const json = node as { toJSON?: () => unknown }
  return walk(typeof json?.toJSON === 'function' ? json.toJSON() : node)
}

const run = (level: string, intent: EffortRun['intent'], count: number): EffortRun => ({ level, intent, count })

describe('traceRows — newest first with escalation-rank transitions', () => {
  it('walks newest first and derives the transition against the older run', () => {
    const rows = traceRows([run('low', 'auto', 3), run('high', 'auto', 12)])
    expect(rows).toEqual([
      { run: { level: 'high', intent: 'auto', count: 12 }, dir: 'up' },
      { run: { level: 'low', intent: 'auto', count: 3 }, dir: 'start' },
    ])
  })

  it('marks a downgrade, a flat repeat (same level, new intent) and custom wire values', () => {
    // max(8) → high(6): down.
    expect(traceRows([run('max', 'auto', 1), run('high', 'auto', 2)])[0]!.dir).toBe('down')
    // high(6) → high(6) with a new intent: flat — the glyph repeats, the tag
    // text carries the difference.
    expect(traceRows([run('high', 'auto', 2), run('high', 'manual', 1)])[0]!.dir).toBe('flat')
    // A gateway-custom value ranks after the standard table: high → ultra = up.
    expect(traceRows([run('high', 'manual', 1), run('ultra', 'manual', 1)])[0]!.dir).toBe('up')
  })

  it('returns no rows for an absent or empty trace', () => {
    expect(traceRows(undefined)).toEqual([])
    expect(traceRows([])).toEqual([])
  })
})

describe('traceOf — the projection face read path', () => {
  it('reads the trace array off the tlAutoSchedule face', () => {
    const trace = [run('high', 'auto', 2)]
    expect(traceOf(sessionsWith(trace), 's1')).toEqual(trace)
  })

  it('regression: reads a BARE state snapshot (the real host shape, no { value } wrapper)', () => {
    // projection-store.ts:236 returns `rows.get(key)?.value` — the state
    // itself. Assuming a `{ value }` wrapper made the tab render its empty
    // state over a filled trace on every real host (4.6.0, live).
    const state = { samples: [], userEffort: 'high', lastEffective: 'low', trace: [run('low', 'manual', 1)] }
    const face = { getSnapshot: () => state, subscribe: () => () => {} }
    const sessions = {
      scope: () => undefined,
      binding: () => ({ session: { projections: { faceOf: () => face } } }),
    } as unknown as SessionsFace
    expect(traceOf(sessions, 's1')).toEqual([run('low', 'manual', 1)])
  })

  it('still unwraps a legacy { value } wrapper', () => {
    const face = { getSnapshot: () => ({ value: { trace: [run('max', 'auto', 1)] } }), subscribe: () => () => {} }
    const sessions = {
      scope: () => undefined,
      binding: () => ({ session: { projections: { faceOf: () => face } } }),
    } as unknown as SessionsFace
    expect(traceOf(sessions, 's1')).toEqual([run('max', 'auto', 1)])
  })

  it('degrades to undefined on every absent piece', () => {
    expect(traceOf(undefined, 's1')).toBeUndefined()
    expect(traceOf(sessionsWith([run('high', 'auto', 1)]), undefined)).toBeUndefined()
    expect(traceOf(sessionsWith(undefined), 's1')).toBeUndefined()
  })

  it('degrades to undefined when the face throws (never escapes a cosmetic read)', () => {
    const hostile = {
      scope: () => undefined,
      binding: () => {
        throw new Error('odd session shape')
      },
    } as unknown as SessionsFace
    expect(traceOf(hostile, 's1')).toBeUndefined()
  })
})

describe('EffortTrace — the conversation-view tab body', () => {
  it('renders one row per run, newest first, with glyph + intent + count', () => {
    const trace = [run('low', 'auto', 3), run('high', 'auto', 12), run('high', 'manual', 2)]
    const renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions: sessionsWith(trace), t: identity }))
    const lines = texts(renderer).join('|')
    // Newest first: the manual high run leads, the flat glyph marks the same
    // level as its older neighbour, and the run-length counts show. The pipes
    // are the text-leaf boundaries of the joined serialization. Each row reads
    // glyph → level → intent tag → count → direction note (perm-gate order).
    expect(lines).toContain('=|high|trace.intent.manual|× 2|trace.dir.flat|↑|high|trace.intent.auto|× 12|trace.dir.up|•|low|trace.intent.auto|× 3|trace.dir.start')
  })

  it('renders the empty state when the face or the trace is missing', () => {
    const none = create(createElement(EffortTrace, { sessionId: 's1', sessions: undefined, t: identity }))
    expect(texts(none).join('|')).toContain('trace.empty')
    const emptyTrace = create(createElement(EffortTrace, { sessionId: 's1', sessions: sessionsWith([]), t: identity }))
    expect(texts(emptyTrace).join('|')).toContain('trace.empty')
  })

  it('survives an undefined t (identity fallback) and a throwing face', () => {
    const hostile: SessionsFace = {
      scope: () => undefined,
      binding: () => { throw new Error('boom') },
    } as unknown as SessionsFace
    const renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions: hostile }))
    expect(texts(renderer).join('|')).toContain('trace.empty')
  })

  it('updates the rows when the projection face publishes', () => {
    let listeners: (() => void)[] = []
    // The face caches its snapshot object (the store's row value is
    // reference-stable between publishes — useSyncExternalStore requires that).
    let snapshot: { trace: readonly EffortRun[] } = { trace: [run('high', 'auto', 1)] }
    const face = {
      getSnapshot: () => snapshot,
      subscribe: (listener: () => void) => {
        listeners.push(listener)
        return () => { listeners = listeners.filter(l => l !== listener) }
      },
    }
    const sessions = {
      scope: () => undefined,
      binding: () => ({ session: { projections: { faceOf: () => face } } }),
    } as unknown as SessionsFace
    // act around create: the store subscription attaches in a passive effect,
    // which must flush before the publish callback fires.
    let renderer!: ReturnType<typeof create>
    act(() => {
      renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions, t: identity }))
    })
    // A single run is the timeline's start: the start glyph, no count badge.
    expect(texts(renderer).join('|')).toContain('•|high|trace.intent.auto')
    act(() => {
      snapshot = { trace: [run('high', 'auto', 1), run('low', 'auto', 4)] }
      for (const listener of listeners) listener()
    })
    expect(texts(renderer).join('|')).toContain('↓|low|trace.intent.auto|× 4')
  })
})

/**
 * The tab renders like perm-gate's approval history: title + subtitle, a
 * summary strip, then one card per run with a circled glyph, an intent tag, the
 * turn·step the run started in and its wall clock.
 */
describe('EffortTrace — perm-gate presentation parity', () => {
  it('summarizes the session: requests, runs, auto runs and the peak level', () => {
    const trace: EffortRun[] = [
      { level: 'low', intent: 'auto', count: 3 },
      { level: 'high', intent: 'auto', count: 12 },
      { level: 'max', intent: 'manual', count: 1 },
    ]
    expect(summarize(trace)).toEqual({ requests: 16, runs: 3, highest: 'max', autoRuns: 2, unknownRuns: 0, switches: 0 })
    expect(summarize(undefined)).toEqual({ requests: 0, runs: 0, highest: undefined, autoRuns: 0, unknownRuns: 0, switches: 0 })
    expect(summarize([])).toEqual({ requests: 0, runs: 0, highest: undefined, autoRuns: 0, unknownRuns: 0, switches: 0 })
  })

  it('renders the header, the summary strip and a position chip per stamped run', () => {
    const trace: EffortRun[] = [
      { level: 'low', intent: 'manual', count: 1, turn: 1, step: 1 },
      { level: 'high', intent: 'auto', count: 2, turn: 2, step: 3 },
    ]
    const renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions: sessionsWith(trace), t: identity }))
    const text = texts(renderer).join('|')
    // Header + summary strip (the identity translator returns the keys).
    expect(text).toContain('trace.title')
    expect(text).toContain('trace.subtitle')
    expect(text).toContain('|3|trace.summary.requests')
    expect(text).toContain('|2|trace.summary.runs')
    // Per run: level, intent tag, count, T·S position, direction note.
    expect(text).toContain('trace.intent.auto')
    expect(text).toContain('T2·S3')
    expect(text).toContain('T1·S1')
    expect(text).toContain('trace.dir.start')
  })

  it('omits the position and clock chips when a run carries no stamp', () => {
    const renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions: sessionsWith([run('low', 'auto', 1)]), t: identity }))
    const text = texts(renderer).join('|')
    expect(text).not.toContain('T0')
    expect(text).not.toContain('NaN')
  })

  it('labels a run whose intent is unknown (configured default) as default', () => {
    const renderer = create(createElement(EffortTrace, { sessionId: 's1', sessions: sessionsWith([run('high', 'default', 1)]), t: identity }))
    expect(texts(renderer).join('|')).toContain('trace.intent.default')
  })

  it('shows the wall clock of the run start in HH:MM:SS', () => {
    const at = new Date(2026, 0, 2, 3, 4, 5).getTime()
    const renderer = create(createElement(EffortTrace, {
      sessionId: 's1',
      sessions: sessionsWith([{ level: 'high', intent: 'manual', count: 1, turn: 1, step: 1, time: at }]),
      t: identity,
    }))
    expect(texts(renderer).join('|')).toContain('03:04:05')
  })
})

/**
 * The two report halves, rendered: (1) an unrecorded level change must NOT
 * claim "manual" — it reads `未记录`/`unknown` with an explanatory tooltip; (2)
 * every run must name the provider/model it was sent to.
 */
describe('EffortTrace — attribution and route rendering', () => {
  it('renders an unrecorded run as unknown, never as manual', () => {
    const renderer = create(createElement(EffortTrace, {
      sessionId: 's1',
      sessions: sessionsWith([{ level: 'low', intent: 'unknown', count: 1 }]),
      t: identity,
    }))
    const text = texts(renderer).join('|')
    expect(text).toContain('trace.intent.unknown')
    expect(text).not.toContain('trace.intent.manual')
  })

  it('counts unrecorded runs in the summary strip', () => {
    const summary = summarize([
      { level: 'high', intent: 'manual', count: 1 },
      { level: 'low', intent: 'unknown', count: 2 },
      { level: 'high', intent: 'unknown', count: 1 },
    ])
    expect(summary.unknownRuns).toBe(2)
    expect(summary.autoRuns).toBe(0)
  })

  it('names the provider/model route on each run', () => {
    const renderer = create(createElement(EffortTrace, {
      sessionId: 's1',
      sessions: sessionsWith([
        { level: 'high', intent: 'manual', count: 1, provider: 'trae', model: 'deepseek-v4.1-flash' },
        { level: 'low', intent: 'unknown', count: 1, provider: 'deepseek-own', model: 'deepseek-flash' },
      ]),
      t: identity,
    }))
    const text = texts(renderer).join('|')
    expect(text).toContain('trae/deepseek-v4.1-flash')
    expect(text).toContain('deepseek-own/deepseek-flash')
  })

  it('shows the switch count in the summary when the session changed models', () => {
    const renderer = create(createElement(EffortTrace, {
      sessionId: 's1',
      sessions: sessionsWith([{ level: 'high', intent: 'manual', count: 1 }]),
      t: identity,
    }))
    // No switch count on a route-less trace: the chip is omitted entirely.
    expect(texts(renderer).join('|')).not.toContain('trace.summary.switches')
  })
})
