/**
 * N1 (4.8.0) guards: the selectable-language catalog this plugin contributes via
 * `LocaleRuntime.addLanguage`, and the dictionaries that back each entry.
 * 1. LOCALE_PACKS shape (9 entries, unique ids, en-terminated fallback, native labels);
 * 2. source-level order: addLanguage runs before the zh/en dictionary registration;
 * 3. degrade path: a runtime without addLanguage still gets every dictionary, no throw.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { LOCALE_PACKS, NS, de as deDict, en, es, fr, it as itDict, ja, ko, pt, ru, zh } from '../src/client/locales.ts'

const PACK_IDS = ['zh', 'ja', 'ko', 'fr', 'de', 'it', 'ru', 'es', 'pt'] as const

describe('LOCALE_PACKS catalog', () => {
  it('carries exactly the 9 packed languages', () => {
    expect(LOCALE_PACKS).toHaveLength(9)
    expect(LOCALE_PACKS.map((p) => p.id)).toEqual(PACK_IDS)
  })

  it('has unique ids', () => {
    const ids = LOCALE_PACKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('terminates every fallback chain at English (host contract)', () => {
    for (const pack of LOCALE_PACKS) {
      expect(pack.fallback).toBe('en')
    }
  })

  it('writes each label as the native self-name, not the English one', () => {
    // Several self-names are pure ASCII (Deutsch/Italiano/Español without accents would
    // still pass a non-ASCII probe only by luck) — pin the exact native spelling.
    const NATIVE = ['简体中文', '日本語', '한국어', 'Français', 'Deutsch', 'Italiano', 'Русский', 'Español', 'Português']
    expect(LOCALE_PACKS.map((p) => p.label)).toEqual(NATIVE)
    expect(LOCALE_PACKS.map((p) => p.label)).not.toContain('Japanese')
    expect(LOCALE_PACKS.map((p) => p.label)).not.toContain('German')
  })

  it('keeps display order stable (fixed array order, not object key order)', () => {
    expect(LOCALE_PACKS.map((p) => p.id)).toEqual([...PACK_IDS])
  })
})

describe('dictionary installation in src/client/index.ts', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/client/index.ts', import.meta.url)), 'utf8')

  it('registers languages BEFORE the zh/en dictionary (addLanguage first)', () => {
    const addIdx = source.indexOf('runtime.addLanguage({')
    const regIdx = source.indexOf("runtime.register(NS, { zh, en })")
    expect(addIdx).toBeGreaterThan(-1)
    expect(regIdx).toBeGreaterThan(-1)
    expect(addIdx).toBeLessThan(regIdx)
  })

  it('probes addLanguage capability instead of assuming it', () => {
    expect(source).toContain("typeof runtime.addLanguage === 'function'")
  })

  it('isolates a refused language from the rest (per-entry try/catch)', () => {
    const block = source.slice(source.indexOf('for (const pack of LOCALE_PACKS)'), source.indexOf('disposers.push(runtime.register(NS, { zh, en }))'))
    expect(block).toContain('try {')
    expect(block).toContain('catch (error)')
  })
})

describe('degrade path: runtime without addLanguage', () => {
  /** Mirror of the effect body in src/client/index.ts — same probe, same order. */
  function installDictionaries(runtime: {
    register: (ns: string, locale: string | Record<string, Record<string, string>>, dict?: Record<string, string>) => () => void
    addLanguage?: (input: { id: string; label: string; fallback: string }) => () => void
  }): void {
    if (typeof runtime.addLanguage === 'function') {
      for (const pack of LOCALE_PACKS) {
        try {
          runtime.addLanguage({ id: pack.id, label: pack.label, fallback: pack.fallback })
        } catch (error) {
          void error
        }
      }
    }
    runtime.register(NS, { zh, en })
    for (const [id, dict] of [['ja', ja], ['ko', ko], ['fr', fr], ['de', deDict], ['it', itDict], ['ru', ru], ['es', es], ['pt', pt]] as const) {
      runtime.register(NS, id, dict)
    }
  }

  it('does not throw and still registers every dictionary when addLanguage is absent', () => {
    const register = vi.fn(() => () => {})
    expect(() => installDictionaries({ register })).not.toThrow()
    expect(register).toHaveBeenCalledTimes(9)
    expect(register).toHaveBeenCalledWith(NS, { zh, en })
    expect(register).toHaveBeenCalledWith(NS, 'ru', ru)
  })

  it('calls addLanguage for every pack when the API exists', () => {
    const register = vi.fn(() => () => {})
    const addLanguage = vi.fn(() => () => {})
    installDictionaries({ register, addLanguage })
    expect(addLanguage).toHaveBeenCalledTimes(LOCALE_PACKS.length)
    expect(addLanguage).toHaveBeenCalledWith({ id: 'pt', label: 'Português', fallback: 'en' })
  })

  it('survives a host that refuses one language (throw on duplicate id)', () => {
    const register = vi.fn(() => () => {})
    let seen = 0
    const addLanguage = vi.fn(() => {
      seen += 1
      if (seen === 2) throw new Error('duplicate language id')
      return () => {}
    })
    expect(() => installDictionaries({ register, addLanguage })).not.toThrow()
    expect(addLanguage).toHaveBeenCalledTimes(9)
    expect(register).toHaveBeenCalledTimes(9)
  })
})
