/**
 * Local contract declarations for the @deepseek-ai/* platform surfaces the
 * plugin consumes. The npm publication chain for the harness client packages
 * is incomplete (rc placeholders miss several transitive packages), and the
 * plugin never value-imports them anyway — the browser half talks to cordis
 * services and slot registration only, and the loader module table supplies
 * the real modules at runtime.
 *
 * These declarations mirror the harness sources at the anchors below for the
 * supported release segment `>=0.1.2-alpha.1 <0.2.0-0` — the segment that
 * removed `@deepseek-ai/dsh-client-runtime`. Members are declared only where
 * this plugin reads them, so drift against a future harness release shows up
 * as a slot-registration or type error at build time instead of in a browser.
 *
 * Mirror anchors (verified 2026-09-11 against dsh-v0.1.5-rc.2; the
 * `configForms` face mirrors the DSH 0.1.7 settings contract):
 * - `packages/client/ui-renderer/src/client/registry.ts:95` — `SlotRegistry`,
 *   the `slots` service behind this mirror's `SlotsFace`.
 * - `packages/client/ui-settings/src/client/settings-contract.ts` — `ConfigForm`.
 * - `packages/client/locale/src/client/index.ts:380` — the `register` overloads.
 */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  /** Slot map entries consumed by this plugin (subset of the harness table). */
  export interface SlotMap {
    /**
     * The composer tool row's right seat (next to the model/effort control,
     * before the send button): the plugin renders its context-window quick
     * control here. Session-scoped list seat with no owner props, one-row
     * height budget.
     */
    'conversation.input.right': { kind: 'list'; scope: 'session' }
  }

  /** Locale namespaces merged by client plugins. */
  export interface LocaleNamespaceMap {
    'thinking-levels': string
  }

  /** Translate thunk bound to one dictionary namespace. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the type parameter constrains the namespace key
  export type TranslateNS<_N extends keyof LocaleNamespaceMap & string> =
    (key: string, params?: Record<string, unknown>) => string

  /** Locale seat delivered to slot components. */
  export type PropsLocale<N extends keyof LocaleNamespaceMap & string> = { t: TranslateNS<N> }

  /** One registration's options (keyed-list shape used by this plugin). */
  export interface SlotRegisterOptions<K extends keyof SlotMap & string> {
    name: K
    id?: string
    key?: string
    order?: number
    priority?: number
    locale?: string
    inject?: (...args: never[]) => unknown
  }

  /** The slot registry face available on the client context. */
  export interface SlotsFace {
    /** Wait for the slot declaration, register, and roll back with the caller fiber. */
    inject(name: keyof SlotMap & string, fn: () => unknown): () => void
    register<K extends keyof SlotMap & string>(options: SlotRegisterOptions<K>, component: unknown): () => void
  }
}

declare module '@deepseek-ai/dsh-client-locale/client' {
  /** Dictionary registration face. Returns the disposer that drops the dictionaries. */
  export interface LocaleFace {
    register(namespace: string, dictionaries: Record<string, Record<string, string>>): () => void
    /**
     * Bind a namespace to a translate function that re-reads the active locale
     * per call (stable reference per namespace).
     */
    bind(namespace: string): (key: string, params?: Record<string, unknown>) => string
  }
}

declare module '@deepseek-ai/dsh-client-ui-settings/client' {
  /** Snapshot of one plugin's config form, as the client reads it. */
  export interface ConfigFormSnapshot<T> {
    status: 'loading' | 'ready' | 'unavailable'
    value: T | undefined
    /** Composition base layer and raw user layer, exposed for override display. */
    base: unknown
    user: unknown
    /** Write fence: the revision this snapshot was folded at. */
    revision: number | undefined
    writable: boolean
    mode: 'host' | 'memory'
  }

  /**
   * One plugin's config form (DSH 0.1.7 `configForms` service), keyed by the
   * plugin's composition entry id. Replaces the retired per-namespace
   * binding service: same accessor names, `update` renamed to `mutate`, plus
   * an explicit `dispose`.
   */
  export interface ConfigForm<T> {
    getSnapshot(): ConfigFormSnapshot<T>
    subscribe(listener: () => void): () => void
    set(field: string, value: unknown): Promise<void>
    unset(field: string): Promise<void>
    /** Merge a partial patch into the form's user layer (the retired `update`). */
    mutate(patch: Partial<T>): Promise<void>
    /** Release the form binding; the holder must call it when done. */
    dispose(): void
  }

  /** The `configForms` service face available on the client context. */
  export interface ConfigFormsFace {
    get<T>(entryId: string): ConfigForm<T>
  }
}


