import { describe, expect, it } from 'vitest'
import { recentToolCalls, TOOL_SAMPLE_WINDOW } from '../src/session-events.ts'

const toolCall = (name: string, argumentsText = '') => ({
  type: 'tool/call',
  data: { name, arguments: argumentsText },
})

describe('recentToolCalls', () => {
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
