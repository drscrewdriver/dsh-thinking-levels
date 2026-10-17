import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import {
  normalizeDescriptors,
  readSection,
  readSectionOf,
  resolveNamespaceOf,
  type SettingsDescriptorLike,
} from '../src/settings-read.ts'

/** A fake host context whose `settings` service serves the given descriptors. */
function ctxWith(descriptors: SettingsDescriptorLike[] | undefined, hasService = true): Context {
  return {
    get(key: string) {
      if (key !== 'settings') return undefined
      if (!hasService) return undefined
      return { describe: () => descriptors }
    },
  } as unknown as Context
}

const descriptors: SettingsDescriptorLike[] = [
  { ns: 'llm-pi-ai', value: { providers: { local35b: { baseURL: 'http://x/v1' } } }, revision: 3 },
  { ns: 'llm-openai-completions', value: { enabled: true, providers: ['local35b'] }, revision: 1 },
]

describe('readSectionOf', () => {
  it('picks the requested namespace with its revision', () => {
    const readout = readSectionOf<{ providers: Record<string, unknown> }>(descriptors, 'llm-pi-ai')
    expect(readout?.revision).toBe(3)
    expect(readout?.value.providers?.local35b).toBeDefined()
  })

  it('returns undefined when the namespace is not an active entry', () => {
    expect(readSectionOf(descriptors, 'absent-ns')).toBeUndefined()
    expect(readSectionOf(undefined, 'llm-pi-ai')).toBeUndefined()
  })
})

describe('readSection', () => {
  it('reads through the settings service describe()', () => {
    expect(readSection(ctxWith(descriptors), 'llm-openai-completions')?.value)
      .toEqual({ enabled: true, providers: ['local35b'] })
  })

  it('returns undefined when the settings service is absent', () => {
    expect(readSection(ctxWith(descriptors, false), 'llm-pi-ai')).toBeUndefined()
  })

  it('returns undefined when the service lacks describe (pre-0.1.7 face)', () => {
    const ctx = { get: () => ({}) } as unknown as Context
    expect(readSection(ctx, 'llm-pi-ai')).toBeUndefined()
  })
})

describe('normalizeDescriptors — describe() 形状归一（fail-loud 代替静默冻结）', () => {
  it('进程内数组原样通过', () => {
    const rows = [{ ns: 'thinking-levels', value: {}, revision: 1 }]
    expect(normalizeDescriptors(rows)).toBe(rows)
  })

  it('RPC 信封 {writable, hasDocument, namespaces:[…]} 下钻一层', () => {
    const rows = [{ ns: 'a', value: {}, revision: 2 }]
    expect(normalizeDescriptors({ writable: true, hasDocument: false, namespaces: rows })).toBe(rows)
  })

  it('垃圾形状（undefined/对象/字符串）返回 undefined，绝不抛 TypeError', () => {
    for (const junk of [undefined, null, {}, 'x', 42, { namespaces: 'nope' }]) {
      expect(normalizeDescriptors(junk as unknown)).toBeUndefined()
    }
  })

  it('归一后消费面安全：readSectionOf/resolveNamespaceOf 对 undefined 交回缺省', () => {
    expect(readSectionOf(undefined, 'x')).toBeUndefined()
    expect(resolveNamespaceOf(normalizeDescriptors({ bogus: 1 }), ['x', 'y'])).toBeUndefined()
  })
})
