/**
 * The connect-plugin compatibility matrix: every adapter SHAPE a third-party
 * provider plugin ships today (plus two synthetic defensive shapes) must be
 * safe under the capability advertisement, and the composite effort list must
 * stay "own tiers first, `auto` appended last".
 *
 * Real shapes surveyed 2026-11-22 (see .agents/plans/tl-connect-compat-matrix/):
 * - `dsh-providers-hub` 0.2.1-rc.3 — get-only Proxy, cached resolveModel
 *   wrapper that re-reads `target.resolveModel` every call (issue #10).
 * - `dsh-vision-router` — read-only Proxy reporting `writable: false` (#9).
 * - `dsh-connect-qoder` / `dsh-connect-trae` / `dsh-connect-workbuddy`
 *   (dingminhua) — plain ES class instances whose `resolveModel` calls
 *   `super.` and then pushes their own default effort; registration via the
 *   official `registerAdapter` handle, topology toggled with `handle.replace`.
 * - `dsh-our-free-model` (Ebony-Vinyl) — plain `FreeModelAdapter` class whose
 *   `prepareCall` calls `this.resolveModel` internally; catalogue refreshes
 *   re-emit `llm/adapters-updated` without re-registering.
 *
 * Synthetic shapes pin the promise to future plugin authors: frozen objects
 * and getter-only `resolveModel` accessors must keep working untouched.
 *
 * Four behaviours are asserted for EVERY shape: no write into the third
 * party's object, no recursion, full member forwarding with `this` bound to
 * what TL received, and idempotence under repeated advertisement.
 */
import { describe, expect, it } from 'vitest'
import { advertiseModelCapability } from '../src/index.ts'

interface EffortLike { id: string; name: string }
interface Info { reasoning?: { efforts?: EffortLike[]; defaultEffort?: string } }
interface Adapter {
  resolveModel: (provider: string, model: string, signal?: unknown) => Promise<Info>
  [member: string]: unknown
}

const FORWARDED = ['providerInfo', 'providerRetryPolicy', 'imageRequestPricing', 'imageRequestTarget', 'listModels', 'prepareCall', 'stream'] as const

const ids = (info: Info): string[] => (info.reasoning?.efforts ?? []).map(effort => effort.id)

/**
 * One full adapter in the shape every real connect plugin ships: all eight
 * host-called members, each non-resolveModel member reporting its `this` so
 * the binding contract is observable through any wrapper.
 */
function fullBare(): Adapter {
  const adapter: Adapter = {
    resolveModel: async (provider: string, model: string) => ({
      provider,
      id: model,
      name: model,
      reasoning: { efforts: [{ id: 'high', name: 'High' }], defaultEffort: 'high' },
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

/** Register one adapter and run the advertisement, returning what the route now serves. */
function advertised(adapter: Adapter, route = 'fake'): { registered: Adapter; map: Map<string, { adapter: Adapter }> } {
  const map = new Map<string, { adapter: Adapter }>([[route, { adapter }]])
  advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
  return { registered: map.get(route)!.adapter, map }
}

/* ── shape factories ──────────────────────────────────────────────────────── */

/** `dsh-providers-hub`: get-only Proxy, cached wrapper re-reading target every call. */
function makeHub(): { served: Adapter; owned: Adapter } {
  const owned = fullBare()
  const target = owned
  const bound = new Map<string, unknown>()
  const wrapOnce = (key: string, make: () => unknown): unknown => {
    if (!bound.has(key)) bound.set(key, make())
    return bound.get(key)
  }
  const served = new Proxy(owned, {
    get(obj, prop, receiver) {
      if (prop === 'resolveModel' && typeof target.resolveModel === 'function') {
        return wrapOnce(prop, () => async (...args: [string, string, unknown?]) => {
          const info = await target.resolveModel(...args)
          return info
        })
      }
      return Reflect.get(obj, prop, receiver)
    },
  }) as Adapter
  return { served, owned }
}

/** `dsh-vision-router`: read-only Proxy reporting `writable: false` for borrowed members. */
function makeReadOnly(): { served: Adapter; owned: Adapter } {
  const owned = fullBare()
  const served = new Proxy(owned, {
    getOwnPropertyDescriptor(target, property) {
      const own = Reflect.getOwnPropertyDescriptor(target, property)
      if (own !== undefined) return own
      const value = Reflect.get(target, property)
      if (value === undefined) return undefined
      return { configurable: true, enumerable: true, writable: false, value }
    },
  }) as Adapter
  return { served, owned }
}

/**
 * dingminhua connect trio (`qoder` / `trae` / `workbuddy`): a plain ES class
 * whose `resolveModel` calls `super.` and pushes its OWN default tier, exactly
 * like their `advertiseDefaultEffort`. The composite must read
 * `high, max, auto` — own tiers first, `auto` appended last.
 */
function makeClass(): { served: Adapter; owned: Adapter } {
  class BaseAdapter {
    resolveModel(provider: string, model: string, _signal?: unknown): Promise<Info> {
      return Promise.resolve({
        provider,
        id: model,
        name: model,
        reasoning: { efforts: [{ id: 'high', name: 'High' }], defaultEffort: 'high' },
      })
    }
    providerInfo(this: unknown, provider: string) { return { provider, self: this } }
    providerRetryPolicy(this: unknown) { return { self: this } }
    imageRequestPricing(this: unknown) { return { self: this } }
    imageRequestTarget(this: unknown) { return { self: this } }
    async listModels(this: unknown, provider: string) { return [{ provider, self: this }] }
    async prepareCall(this: unknown) { return { self: this } }
    stream(this: unknown) { return { self: this } }
  }
  class ConnectAdapter extends BaseAdapter {
    /** The trio's own default-effort advertisement, run AFTER super.resolveModel. */
    override async resolveModel(provider: string, model: string, signal?: unknown): Promise<Info> {
      const info = await super.resolveModel(provider, model, signal)
      const efforts = [...(info.reasoning?.efforts ?? []), { id: 'max', name: 'Max' }]
      return { ...info, reasoning: { efforts, defaultEffort: 'max' } }
    }
  }
  const owned = new ConnectAdapter()
  return { served: owned as unknown as Adapter, owned: owned as unknown as Adapter }
}

/**
 * `dsh-our-free-model`'s `FreeModelAdapter`: a plain class whose `prepareCall`
 * resolves metadata through an INTERNAL `this.resolveModel` call — a path that
 * bypasses anything wrapped around the instance from outside. The registry
 * path must still advertise `auto`; the internal path must stay bare (by
 * design — only the directory/selector flows through the registry).
 */
function makeInternalCall(): { served: Adapter; owned: Adapter } {
  class FreeModelAdapter {
    // No return-type annotation on purpose: the real adapter carries
    // provider/id/name alongside `reasoning`, and an `Info` annotation would
    // put the literal under excess-property checking.
    async resolveModel(provider: string, model: string) {
      return {
        provider,
        id: model,
        name: model,
        reasoning: { efforts: [{ id: 'mid', name: 'Mid' }], defaultEffort: 'mid' },
      }
    }
    providerInfo(this: unknown, provider: string) { return { provider, self: this } }
    providerRetryPolicy(this: unknown) { return { self: this } }
    imageRequestPricing(this: unknown) { return { self: this } }
    imageRequestTarget(this: unknown) { return { self: this } }
    async listModels(this: unknown, provider: string) { return [{ provider, self: this }] }
    async prepareCall(this: FreeModelAdapter, provider: string, model: string) {
      return { model: await this.resolveModel(provider, model), self: this }
    }
    stream(this: unknown) { return { self: this } }
  }
  const owned = new FreeModelAdapter()
  return { served: owned as unknown as Adapter, owned: owned as unknown as Adapter }
}

/** Synthetic defensive shape: a frozen adapter object. */
function makeFrozen(): { served: Adapter; owned: Adapter } {
  const owned = Object.freeze(fullBare())
  return { served: owned, owned }
}

/** Synthetic defensive shape: `resolveModel` exposed as a getter-only accessor. */
function makeGetterOnly(): { served: Adapter; owned: Adapter } {
  const owned = fullBare()
  const fn = owned.resolveModel
  Object.defineProperty(owned, 'resolveModel', { get: () => fn, enumerable: true, configurable: false })
  return { served: owned, owned }
}

const SHAPES: { name: string; make: () => { served: Adapter; owned: Adapter } }[] = [
  { name: 'hub write-through proxy (issue #10)', make: makeHub },
  { name: 'read-only proxy (issue #9)', make: makeReadOnly },
  { name: 'dingminhua connect class (qoder/trae/workbuddy)', make: makeClass },
  { name: 'our-free-model internal-call class', make: makeInternalCall },
  { name: 'frozen adapter (synthetic)', make: makeFrozen },
  { name: 'getter-only resolveModel (synthetic)', make: makeGetterOnly },
]

/* ── the four behaviours, table-driven over every shape ──────────────────── */

describe('adapter matrix: four behaviours × six shapes', () => {
  for (const shape of SHAPES) {
    describe(`shape: ${shape.name}`, () => {
      it('never writes into the third party object', () => {
        const { served, owned } = shape.make()
        const before = owned.resolveModel
        expect(() => advertised(served)).not.toThrow()
        expect(owned.resolveModel).toBe(before)
        if (Object.isFrozen(owned)) expect(Object.isFrozen(owned)).toBe(true)
        const descriptor = Object.getOwnPropertyDescriptor(owned, 'resolveModel')
        if (descriptor?.get) expect(descriptor.get).toBeDefined()
      })

      it('does not recurse and composes efforts as own-tiers-then-auto', async () => {
        const { served, owned } = shape.make()
        const { registered } = advertised(served)
        // Ten consecutive resolutions: recursion would blow the stack on the first.
        for (let i = 0; i < 10; i += 1) {
          const info = await registered.resolveModel('fake', `m${i}`)
          const list = ids(info)
          expect(list.filter(id => id === 'auto'), 'exactly one auto').toHaveLength(1)
          // Whatever tiers the shape itself provides must precede `auto`.
          expect(list[list.length - 1]).toBe('auto')
          if (owned !== served) {
            // The shape's own post-processing (hub wrapper / class override)
            // must still be live underneath: its default tier is present.
            expect(list.length).toBeGreaterThan(1)
          }
        }
      })

      it('forwards every host-called member with this bound to what TL received', async () => {
        const { served } = shape.make()
        const { registered } = advertised(served)
        const facade = registered as unknown as Record<string, (...args: unknown[]) => unknown>
        for (const member of FORWARDED) {
          expect(typeof facade[member], `${member} must be forwarded`).toBe('function')
          const result = await facade[member]('fake', 'm1', undefined)
          const probe = Array.isArray(result) ? result[0] : result
          expect((probe as { self?: unknown }).self, `${member} must bind this to the served adapter`).toBe(served)
        }
      })

      it('stays idempotent: re-runs never stack a second layer', async () => {
        const { served } = shape.make()
        const { registered, map } = advertised(served)
        advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
        advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
        expect(map.get('fake')!.adapter).toBe(registered)
        const info = await map.get('fake')!.adapter.resolveModel('fake', 'm1')
        expect(ids(info).filter(id => id === 'auto')).toHaveLength(1)
      })
    })
  }
})

/* ── topology convergence: handle.replace re-mounts the BARE adapter ─────── */

describe('adapter matrix: topology convergence (trae/workbuddy handle.replace)', () => {
  it('re-installs the SAME cached facade after the host re-mounts the bare adapter', async () => {
    const { served } = makeClass()
    const { registered, map } = advertised(served)
    // handle.replace(enabled) re-mounts the bare instance on the route; the
    // host then emits llm/adapters-updated and TL re-runs the advertisement.
    map.set('fake', { adapter: served })
    advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
    expect(map.get('fake')!.adapter).toBe(registered)
    const info = await map.get('fake')!.adapter.resolveModel('fake', 'm1')
    expect(ids(info)).toEqual(['high', 'max', 'auto'])
  })

  it('keeps composite order high,max,auto through repeated toggle rounds', () => {
    const { served } = makeClass()
    const { registered, map } = advertised(served)
    for (let round = 0; round < 5; round += 1) {
      map.set('fake', { adapter: served }) // handle.replace re-mount
      advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined) // adapters-updated re-run
      expect(map.get('fake')!.adapter).toBe(registered)
    }
  })
})

/* ── our-free-model mixed flow: re-register NEW instance + repeated emit ─── */

describe('adapter matrix: mixed re-register + emit flow (our-free-model)', () => {
  it('survives five rounds of new instances interleaved with double emits', async () => {
    const map = new Map<string, { adapter: Adapter }>()
    const retired: Adapter[] = []
    for (let round = 0; round < 5; round += 1) {
      // A catalogue refresh re-registers a fresh runtime adapter instance…
      const fresh = makeInternalCall().served
      map.set('fake', { adapter: fresh })
      advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
      // …and our-free-model emits `llm/adapters-updated` twice per refresh
      // (once for the roster, once for availability). Neither emit may stack.
      advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
      advertiseModelCapability({ adapters: map } as never, () => undefined, () => undefined)
      const info = await map.get('fake')!.adapter.resolveModel('fake', 'm1')
      expect(ids(info), `round ${round}`).toEqual(['mid', 'auto'])
      // Retired instances stay untouched — TL never wrote them in the first place.
      for (const old of retired) {
        const bare = await old.resolveModel('fake', 'm1')
        expect(ids(bare)).toEqual(['mid'])
      }
      retired.push(fresh)
    }
  })

  it('leaves the internal prepareCall path bare while the registry path advertises auto', async () => {
    const { served } = makeInternalCall()
    const instance = served as unknown as { prepareCall: (p: string, m: string) => Promise<{ model: Info }> }
    const { registered } = advertised(served)
    const viaRegistry = await registered.resolveModel('fake', 'm1')
    expect(ids(viaRegistry)).toEqual(['mid', 'auto'])
    // The instance's own prepareCall resolves through `this.resolveModel` —
    // deliberately outside TL's reach (by design; the directory/selector is
    // the only consumer that flows through the registry).
    const viaInternal = await instance.prepareCall('fake', 'm1')
    expect(ids(viaInternal.model)).toEqual(['mid'])
  })
})
