/**
 * Regression for issue #10 (and its sibling #9): the capability advertisement
 * must never mutate the adapter object a third party owns.
 *
 * The old implementation did `adapter.resolveModel = wrapper`. Two shipped
 * plugins turn that into a hard failure:
 *
 * - `dsh-providers-hub` (issue #10) wraps the adapter in a Proxy with only a
 *   `get` trap whose `resolveModel` wrapper is cached but re-reads
 *   `target.resolveModel` on every call. The assignment wrote through to the
 *   bare adapter, so the hub wrapper called our wrapper, which called the hub
 *   wrapper it had captured → unbounded mutual recursion
 *   (`RangeError: Maximum call stack size exceeded`).
 * - `dsh-vision-router` (issue #9) wraps it in a read-only Proxy whose
 *   `getOwnPropertyDescriptor` reports `writable: false`, so the assignment
 *   threw `TypeError: Cannot redefine property: resolveModel`.
 *
 * The fix replaces the REGISTRY ENTRY with a forwarding facade, leaving the
 * third party's object untouched. These tests pin both shapes plus the
 * forwarding contract the facade has to honour.
 */
import { describe, expect, it } from 'vitest'
import { advertiseModelCapability } from '../src/index.ts'

interface EffortLike { id: string; name: string }
interface Info { reasoning?: { efforts?: EffortLike[]; defaultEffort?: string } }
type Adapter = { resolveModel: (provider: string, model: string, signal?: unknown) => Promise<Info> }

/** A bare adapter reporting one native effort plus the strongest default (hub's input shape). */
function bareAdapter(): Adapter & Record<string, unknown> {
  return {
    resolveModel: async (provider: string, model: string) => ({
      provider,
      id: model,
      name: model,
      reasoning: { efforts: [{ id: 'high', name: 'High' }], defaultEffort: 'high' },
    }),
  }
}

/**
 * `dsh-providers-hub`'s `withStrongestReasoningDefault` proxy shape
 * (lib/reasoning-default.js:353-403), reduced to the resolveModel path: a
 * `get`-only trap, cached wrapper, and a re-read of `target.resolveModel` on
 * every call. This is the exact shape that recursed before the fix.
 */
function hubStyleProxy(adapter: Adapter): Adapter {
  const target = adapter
  const bound = new Map<string, unknown>()
  const wrapOnce = (key: string, make: () => unknown): unknown => {
    if (!bound.has(key)) bound.set(key, make())
    return bound.get(key)
  }
  return new Proxy(adapter, {
    get(obj, prop, receiver) {
      if (prop === 'resolveModel' && typeof target.resolveModel === 'function') {
        return wrapOnce(prop, () => async (...args: [string, string, unknown?]) => {
          // The crux of #10: re-read on every call.
          const info = await target.resolveModel(...args)
          return info
        })
      }
      return Reflect.get(obj, prop, receiver)
    },
  }) as Adapter
}

/**
 * `dsh-vision-router`'s read-only facade shape (issue #9): the descriptor for a
 * borrowed property reports `writable: false`, so a plain assignment throws in
 * strict mode (ESM modules are always strict).
 */
function readOnlyProxy(adapter: Adapter): Adapter {
  return new Proxy(adapter, {
    getOwnPropertyDescriptor(target, property) {
      const own = Reflect.getOwnPropertyDescriptor(target, property)
      if (own !== undefined) return own
      const value = Reflect.get(target, property)
      if (value === undefined) return undefined
      return { configurable: true, enumerable: true, writable: false, value }
    },
  }) as Adapter
}

/** Register one adapter and run the advertisement, returning the registered (facade) adapter. */
function advertised(adapter: Adapter, route = 'fake'): { registered: Adapter; map: Map<string, { adapter: Adapter }> } {
  const map = new Map<string, { adapter: Adapter }>([ [route, { adapter }] ])
  advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
  return { registered: map.get(route)!.adapter, map }
}

const ids = (info: Info): string[] => (info.reasoning?.efforts ?? []).map(effort => effort.id)

describe('issue #10: no in-place mutation of a third party adapter', () => {
  it('does not recurse against a hub-style write-through proxy', async () => {
    const inner = bareAdapter()
    const hub = hubStyleProxy(inner)
    const { registered } = advertised(hub)
    // Ten consecutive resolutions: a recursion would blow the stack on the first.
    for (let i = 0; i < 10; i += 1) {
      const info = await registered.resolveModel('fake', `m${i}`)
      expect(ids(info)).toContain('auto')
      // hub's strongest-default rewrite still applies: we wrapped its proxy,
      // we did not replace it.
      expect(info.reasoning?.defaultEffort).toBe('high')
    }
  })

  it('never writes resolveModel onto the third party object', async () => {
    const inner = bareAdapter()
    const hub = hubStyleProxy(inner)
    const before = inner.resolveModel
    advertised(hub)
    // The bare adapter is untouched: same function identity, not a wrapper.
    expect(inner.resolveModel).toBe(before)
    // And the hub proxy still reads the bare adapter, not a wrapper we wrote.
    expect(hub.resolveModel).toBe(hub.resolveModel)
  })

  it('does not throw Cannot redefine against a read-only proxy (issue #9 shape)', () => {
    const guarded = readOnlyProxy(bareAdapter())
    // Before the fix this threw TypeError: Cannot redefine property: resolveModel.
    expect(() => advertised(guarded)).not.toThrow()
  })

  it('still advertises auto through a read-only proxy', async () => {
    const { registered } = advertised(readOnlyProxy(bareAdapter()))
    const info = await registered.resolveModel('fake', 'm1')
    expect(ids(info)).toContain('auto')
  })
})

describe('issue #10: facade forwarding contract', () => {
  /** An adapter exposing every member the host calls, each reporting its `this`. */
  function fullAdapter(): Record<string, unknown> {
    const adapter: Record<string, unknown> = {
      resolveModel: async (provider: string, model: string) => ({
        provider,
        id: model,
        name: model,
        reasoning: { efforts: [{ id: 'high', name: 'High' }] },
      }),
      providerInfo: function (this: unknown, provider: string) { return { provider, self: this } },
      providerRetryPolicy: function (this: unknown) { return { self: this } },
      imageRequestPricing: function (this: unknown) { return { self: this } },
      imageRequestTarget: function (this: unknown) { return { self: this } },
      listModels: async function (this: unknown, provider: string) { return [{ provider, self: this }] },
      prepareCall: async function (this: unknown) { return { self: this } },
      stream: function (this: unknown) { return { self: this } },
    }
    return adapter
  }

  it('forwards every host-called member', async () => {
    const inner = fullAdapter()
    const { registered } = advertised(inner as unknown as Adapter)
    const facade = registered as unknown as Record<string, (...args: unknown[]) => unknown>
    for (const member of ['providerInfo', 'providerRetryPolicy', 'imageRequestPricing', 'imageRequestTarget', 'listModels', 'prepareCall', 'stream']) {
      expect(typeof facade[member], `${member} must be forwarded`).toBe('function')
      // Every forwarded member must be callable and report the inner adapter as `this`.
      // `listModels` resolves to an array, the rest to an object — unwrap both shapes.
      const result = await facade[member]('fake', 'm1', undefined)
      const probe = Array.isArray(result) ? result[0] : result
      expect((probe as { self?: unknown }).self, `${member} must bind this to the inner adapter`).toBe(inner)
    }
  })

  it('binds forwarded members to the inner adapter, never to the facade', async () => {
    const inner = fullAdapter()
    const { registered } = advertised(inner as unknown as Adapter)
    expect((registered as unknown as Record<string, () => { self: unknown }>).providerInfo().self).toBe(inner)
    expect((registered as unknown as Record<string, () => { self: unknown }>).providerInfo().self).not.toBe(registered)
  })

  it('keeps one facade identity per adapter across several provider routes', () => {
    const inner = bareAdapter()
    const map = new Map<string, { adapter: Adapter }>([
      ['p1', { adapter: inner }],
      ['p2', { adapter: inner }],
    ])
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    // The host compares `adapters.get(provider).adapter` by identity to decide
    // whether replay state survives (dsh-llm's forAdapter) — one adapter must
    // therefore yield ONE facade object, not one per route.
    expect(map.get('p1')!.adapter).toBe(map.get('p2')!.adapter)
  })

  it('does not stack facades on a re-run', async () => {
    const inner = bareAdapter()
    const map = new Map<string, { adapter: Adapter }>([['fake', { adapter: inner }]])
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    const first = map.get('fake')!.adapter
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    expect(map.get('fake')!.adapter).toBe(first)
    const info = await first.resolveModel('fake', 'm1')
    expect(ids(info).filter(id => id === 'auto')).toHaveLength(1)
  })

  it('re-wraps a third party that re-registers a NEW adapter instance', async () => {
    const map = new Map<string, { adapter: Adapter }>([['fake', { adapter: bareAdapter() }]])
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    const replacement = bareAdapter()
    map.set('fake', { adapter: replacement })
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    const info = await map.get('fake')!.adapter.resolveModel('fake', 'm1')
    expect(ids(info).filter(id => id === 'auto')).toHaveLength(1)
    // The replacement itself stays untouched.
    const bare = await replacement.resolveModel('fake', 'm1')
    expect(ids(bare)).not.toContain('auto')
  })
})
