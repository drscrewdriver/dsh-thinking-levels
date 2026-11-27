/**
 * N4 (4.11.0) failure-signal folding guards: the same-argument grouping, the
 * lookback window, the turn-end error flag, and success isolation.
 */
import { describe, expect, it } from 'vitest'
import { FAILURE_LOOKBACK, failureSignalOf } from '../src/session-events.ts'

const call = (name: string, args: string, failed: boolean): Record<string, unknown> => ({
  type: 'tool/call',
  data: { name, arguments: args, isError: failed },
})
const turnEnd = (kind: string): Record<string, unknown> => ({ type: 'turn/end', data: { reason: { kind } } })

describe('failureSignalOf', () => {
  it('empty / non-tool events read as no evidence', () => {
    expect(failureSignalOf([])).toEqual({ repeatFailures: 0, turnErrored: false })
    expect(failureSignalOf([{ type: 'other', data: {} }])).toEqual({ repeatFailures: 0, turnErrored: false })
  })

  it('two failures of the SAME name+args form one repeat group', () => {
    const events = [call('read', '{"p":"/x"}', true), call('read', '{"p":"/x"}', true)]
    expect(failureSignalOf(events).repeatFailures).toBe(1)
  })

  it('two DIFFERENT failing calls are not one repeat group', () => {
    const events = [call('read', '{"p":"/a"}', true), call('write', '{"p":"/b"}', true)]
    expect(failureSignalOf(events).repeatFailures).toBe(0)
  })

  it('a single failure of a call is not yet a repeat', () => {
    expect(failureSignalOf([call('read', '{"p":"/x"}', true)]).repeatFailures).toBe(0)
  })

  it('successful calls never count', () => {
    const events = [call('read', '{"p":"/x"}', false), call('read', '{"p":"/x"}', false)]
    expect(failureSignalOf(events)).toEqual({ repeatFailures: 0, turnErrored: false })
  })

  it('flags an errored turn', () => {
    expect(failureSignalOf([turnEnd('error')]).turnErrored).toBe(true)
    expect(failureSignalOf([turnEnd('stop')]).turnErrored).toBe(false)
  })

  it('only folds the newest FAILURE_LOOKBACK tool calls (older groups fall out)', () => {
    const old = [call('read', '{"p":"/x"}', true), call('read', '{"p":"/x"}', true)]
    const fresh = Array.from({ length: FAILURE_LOOKBACK }, (_, i) => call('tool' + i, '{}' + i, false))
    expect(failureSignalOf([...old, ...fresh]).repeatFailures).toBe(0)
  })
})
