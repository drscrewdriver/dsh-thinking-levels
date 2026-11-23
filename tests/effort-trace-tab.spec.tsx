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
import { EffortTrace, traceOf, traceRows } from '../src/client/effort-trace.tsx'
import type { EffortRun } from '../src/auto-schedule-projection.ts'

const identity = (key: string): string => key

/** A SessionsFace stub serving one fixed trace through the projection face. */
function sessionsWith(trace: readonly EffortRun[] | undefined, hooks?: { onSubscribe?: (listener: () => void) => void }): SessionsFace {
  const current = trace
  const face = {
    // REAL host shape: the projection face's snapshot IS the state record
    // (`projection-store.ts:236` — `rows.get(key)?.value`), never `{ value }`.
    getSnapshot: () => ({ trace: current }),
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
    // are the text-leaf boundaries of the joined serialization.
    expect(lines).toContain('=|trace.intent.manual |high| ×|2|↑|trace.intent.auto |high| ×|12|•|trace.intent.auto |low| ×|3')
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
    expect(texts(renderer).join('|')).toContain('•|trace.intent.auto |high')
    act(() => {
      snapshot = { trace: [run('high', 'auto', 1), run('low', 'auto', 4)] }
      for (const listener of listeners) listener()
    })
    expect(texts(renderer).join('|')).toContain('↓|trace.intent.auto |low| ×|4')
  })
})
