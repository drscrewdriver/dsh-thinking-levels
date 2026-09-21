import { describe, expect, it } from 'vitest'
import { Session, SessionId, SessionLogOffset } from '@deepseek-ai/dsh-session'
import { recentToolCalls, TOOL_SAMPLE_WINDOW } from '../src/session-events.ts'

const toolCall = (name: string, argumentsText = '') => ({
  type: 'tool/call',
  data: { name, arguments: argumentsText },
})

/**
 * A session double exposing ONLY what the current harness exposes
 * (`eventAt` + `seq` and the bulk accessors) — deliberately without the
 * `events` array member that this module used to read. The previous double
 * *was* `{ events: [...] }`, which is why the suite stayed green while every
 * real session sampled nothing.
 */
const currentHarness = (events: unknown[]) => ({
  eventAt: (index: number) => events[index],
  seq: events.length,
  snapshotEvents: () => events,
})

/** The pre-rename harness (0.1.2-alpha.*), which really did expose `events`. */
const legacyHarness = (events: unknown[]) => ({ events, seq: events.length })

describe('recentToolCalls', () => {
  it('reads the current harness log (no `events` member) — regression', () => {
    const agent = { session: currentHarness([toolCall('bash', 'echo hi')]) }
    expect(recentToolCalls(agent)).toEqual({ calls: [{ name: 'bash', argsSize: 7 }], failed: false })
  })

  it('reads the current harness through random access alone', () => {
    // `eventAt` + `seq` is the cheapest accessor and the first one tried; a
    // session exposing nothing else must still sample.
    const events = [toolCall('bash', 'x'), toolCall('fs_read', 'yy')]
    const agent = { session: { eventAt: (i: number) => events[i], seq: events.length } }
    expect(recentToolCalls(agent)).toEqual({
      calls: [{ name: 'bash', argsSize: 1 }, { name: 'fs_read', argsSize: 2 }],
      failed: false,
    })
  })

  it('falls back to ownEvents() when neither eventAt nor snapshotEvents exists', () => {
    const events = [toolCall('bash', 'x')]
    const agent = { session: { ownEvents: () => events, seq: events.length } }
    expect(recentToolCalls(agent)).toEqual({ calls: [{ name: 'bash', argsSize: 1 }], failed: false })
  })

  it('still reads the pre-0.1.2-rc.1 `events` array (engines.dsh spans both)', () => {
    const agent = { session: legacyHarness([toolCall('bash', 'echo hi')]) }
    expect(recentToolCalls(agent)).toEqual({ calls: [{ name: 'bash', argsSize: 7 }], failed: false })
  })

  it('returns undefined when no accessor can be read — distinct from an empty log', () => {
    // "Cannot observe" must not be reported as "no tool calls happened".
    expect(recentToolCalls(undefined)).toBeUndefined()
    expect(recentToolCalls(null)).toBeUndefined()
    expect(recentToolCalls('agent')).toBeUndefined()
    expect(recentToolCalls({})).toBeUndefined()
    expect(recentToolCalls({ session: {} })).toBeUndefined()
    expect(recentToolCalls({ session: { events: 'nope' } })).toBeUndefined()
    expect(recentToolCalls({ session: currentHarness([]) })).toEqual({ calls: [], failed: false })
  })

  it('treats a session whose accessors throw as unreadable, not as empty', () => {
    const throwing = {
      eventAt: () => { throw new Error('detached') },
      seq: 3,
      snapshotEvents: () => { throw new Error('detached') },
      ownEvents: () => { throw new Error('detached') },
    }
    expect(recentToolCalls({ session: throwing })).toBeUndefined()
  })

  it('extracts only tool/call events, oldest first', () => {
    const agent = {
      session: currentHarness([
        { type: 'user/message', data: {} },
        toolCall('bash', 'echo hi'),
        { type: 'tool/result', data: {} },
        toolCall('fs_read', 'x'.repeat(20)),
      ]),
    }
    expect(recentToolCalls(agent)).toEqual({
      calls: [{ name: 'bash', argsSize: 7 }, { name: 'fs_read', argsSize: 20 }],
      failed: false,
    })
  })

  it('caps the sample window to the most recent calls', () => {
    const events = Array.from({ length: TOOL_SAMPLE_WINDOW + 5 }, (_, i) => toolCall(`tool_${i}`, `${i}`))
    const samples = recentToolCalls({ session: currentHarness(events) })
    expect(samples?.calls).toHaveLength(TOOL_SAMPLE_WINDOW)
    expect(samples?.calls[0].name).toBe(`tool_${5}`)
    expect(samples?.calls[samples.calls.length - 1].name).toBe(`tool_${TOOL_SAMPLE_WINDOW + 4}`)
  })

  it('skips malformed records and defaults missing fields safely', () => {
    const agent = {
      session: currentHarness([
        { type: 'tool/call' }, // data missing
        { type: 'tool/call', data: null },
        { type: 'tool/call', data: { arguments: 42 } }, // name missing, args not a string
        { type: 'tool/call', data: { name: '', arguments: 'abc' } }, // empty name falls back
        { type: 'tool/call', data: { name: 'ok', arguments: undefined } },
      ]),
    }
    expect(recentToolCalls(agent)).toEqual({
      calls: [
        { name: 'tool', argsSize: 0 },
        { name: 'tool', argsSize: 3 },
        { name: 'ok', argsSize: 0 },
      ],
      failed: false,
    })
  })

  it('flags a failed tool round in the same window', () => {
    const failing = {
      type: 'tool/result',
      data: {
        turn: 1,
        step: 1,
        message: {
          id: 'm-1',
          role: 'user',
          source: { kind: 'tool', callId: 'c1' },
          content: [{ type: 'tool-result', toolCallId: 'c1', content: [], isError: true }],
        },
      },
    }
    expect(recentToolCalls({ session: currentHarness([toolCall('bash', 'x'), failing]) })?.failed).toBe(true)
    expect(recentToolCalls({ session: currentHarness([toolCall('bash', 'x')]) })?.failed).toBe(false)
    // Flatter result shapes are honoured rather than assumed absent.
    expect(recentToolCalls({ session: currentHarness([{ type: 'tool/result', data: { isError: true } }]) })?.failed).toBe(true)
  })
})

describe('the harness contract this module is written against', () => {
  // The bug this suite exists to prevent was a test double that encoded an
  // accessor the harness had already removed. These cases build a REAL
  // `@deepseek-ai/dsh-session` object, so the contract cannot drift again
  // without a red test.
  const hdr = () => ({ version: 0 as const, id: SessionId('spec-session'), createdAt: 1789990000000, cwd: process.cwd(), isSeeded: false })
  const event = (seq: number, type: string, data: unknown) => ({ seq, time: 1789990000000 + seq, type, data })
  const call = (seq: number, step: number, callId: string, name: string, args: string) =>
    event(seq, 'tool/call', { turn: 1, step, callId, name, arguments: args })
  const result = (seq: number, step: number, callId: string, callSeq: number, isError: boolean) => ({
    seq,
    time: 1789990000000 + seq,
    type: 'tool/result',
    surfaceOp: 'append',
    sourceEventSeqs: [callSeq],
    data: {
      turn: 1,
      step,
      message: {
        id: `m-${callId}`,
        role: 'user',
        source: { kind: 'tool', callId },
        content: [{ type: 'tool-result', toolCallId: callId, content: [{ type: 'text', text: isError ? 'boom' : 'ok' }], isError }],
      },
    },
  })
  const realSession = (events: readonly unknown[]) =>
    Session.fromRestore(
      SessionId('spec-session'),
      events as unknown as Parameters<typeof Session.fromRestore>[1],
      hdr(),
      SessionLogOffset(0),
    )

  it('a real Session exposes no `events` member (the accessor the old code read)', () => {
    const session = realSession([call(0, 1, 'c1', 'bash', '{}')])
    expect('events' in session).toBe(false)
    expect(typeof session.eventAt).toBe('function')
    expect(typeof session.snapshotEvents).toBe('function')
  })

  it('samples a real Session, including a failed round', () => {
    const session = realSession([
      call(0, 1, 'c1', 'bash', '{"cmd":"ls"}'),
      result(1, 1, 'c1', 0, true),
      call(2, 2, 'c2', 'fs_read', '{"path":"a"}'),
      result(3, 2, 'c2', 2, false),
    ])
    expect(recentToolCalls({ session })).toEqual({
      calls: [{ name: 'bash', argsSize: 12 }, { name: 'fs_read', argsSize: 12 }],
      failed: true,
    })
  })
})
