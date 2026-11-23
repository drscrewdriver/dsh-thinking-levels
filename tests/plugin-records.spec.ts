/**
 * The scheduler-write mark channel: soft coupling, never-throw, one-shot probe.
 *
 * The host package (`@deepseek-ai/dsh-session`) is OPTIONAL — older lines do not
 * export `appendPluginRecord`, and a plugin must never fail a turn because an
 * optional telemetry channel is missing (`agent-loop/README.md:128`: "plugin
 * failure ends the turn"). Every path here resolves to a boolean, never a
 * rejection.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  markSchedulerWrite,
  resetSchedulerMarkChannel,
  schedulerMarkChannel,
  schedulerWriteOf,
} from '../src/plugin-records.ts'

afterEach(() => {
  resetSchedulerMarkChannel()
  vi.restoreAllMocks()
})

describe('markSchedulerWrite — degrades without throwing', () => {
  it('reports unavailable when the host package cannot be imported', async () => {
    const warnings: string[] = []
    // No @deepseek-ai/dsh-session in this repo's node_modules: the dynamic
    // import rejects, which is exactly the older-host shape.
    const committed = await markSchedulerWrite({}, { level: 'low' }, { warn: (m) => warnings.push(m) })
    expect(committed).toBe(false)
    expect(schedulerMarkChannel()).toBe('unavailable')
    expect(warnings).toHaveLength(1)
  })

  it('probes once, then short-circuits (no import per step)', async () => {
    await markSchedulerWrite({}, { level: 'low' })
    const warn = vi.fn()
    await markSchedulerWrite({}, { level: 'high' }, { warn })
    // The probe already ran, so the second call does not log again.
    expect(warn).not.toHaveBeenCalled()
  })

  it('rejects a non-session without importing anything', async () => {
    expect(await markSchedulerWrite(undefined, { level: 'low' })).toBe(false)
    expect(await markSchedulerWrite(null, { level: 'low' })).toBe(false)
    expect(await markSchedulerWrite('nope', { level: 'low' })).toBe(false)
    // The early return happens before the probe, so the channel stays unprobed.
    expect(schedulerMarkChannel()).toBe('unprobed')
  })

  it('never rejects even when the logger itself throws', async () => {
    const hostile = { warn: () => { throw new Error('logger exploded') } }
    await expect(markSchedulerWrite({}, { level: 'low' }, hostile)).resolves.toBe(false)
  })
})

describe('schedulerWriteOf — strict payload normalization', () => {
  const mark = (data: unknown) => ({ type: 'plugin:dsh-thinking-levels/scheduler-write', ignorable: true, data })

  it('keeps only well-typed fields', () => {
    expect(schedulerWriteOf(mark({ level: 'low', clear: true, intent: 'auto', provider: 'p', model: 'm', applied: 'next' })))
      .toEqual({ level: 'low', clear: true, intent: 'auto', provider: 'p', model: 'm', applied: 'next' })
  })

  it('drops an empty level, a non-true clear and an unknown applied', () => {
    expect(schedulerWriteOf(mark({ level: '', clear: false, applied: 'later' }))).toEqual({})
  })

  it('ignores an event whose type merely starts the same', () => {
    expect(schedulerWriteOf({ type: 'plugin:dsh-thinking-levels/scheduler-write-other', data: { level: 'low' } })).toBeUndefined()
  })
})
