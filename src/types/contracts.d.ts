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
 * Mirror anchors (verified 2026-09-11 against dsh-v0.1.5-rc.2):
 * - `packages/client/ui-renderer/src/client/registry.ts:95` — `SlotRegistry`,
 *   the `slots` service behind this mirror's `SlotsFace`.
 * - `packages/client/ui-settings/src/client/settings-contract.ts` — `SettingsScope`.
 * - `packages/client/locale/src/client/index.ts:380` — the `register` overloads.
 *
 * The `slots` service no longer arrives through declaration merging:
 * `0.1.2-rc.1` made `@deepseek-ai/dsh-client-ui-slots` a pure registry
 * ("no cordis") and dropped the cordis Context augmentation, so
 * `src/client/index.ts` acquires it with `ctx.get('slots')` and types it with
 * this mirror's {@link SlotsFace}. `locale` and `settingsScope` still arrive by
 * augmentation and keep their `import type {}` side-effect imports.
 */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  /** Slot map entries consumed by this plugin (subset of the harness table). */
  export interface SlotMap {
    'settings.plugin.item': { kind: 'keyed'; scope: 'root'; owner: object }
    /**
     * The composer tool row's right seat (next to the model/effort control,
     * before the send button): the plugin renders its context-window quick
     * control here. Session-scoped list seat with no owner props, one-row
     * height budget.
     */
    'conversation.input.right': { kind: 'list'; scope: 'session' }
    /**
     * The composer's model seat: the shipped `ModelSelect` owns this seat by
     * default, and a registered entry named after the seat (`priority: -1`)
     * replaces the trigger and its popup outright — the seat panel carries the
     * per-line context-window editor and reasoning effort. Session-scoped
     * single seat carrying the session standard seats (`sessionId`).
     */
    'conversation.input.model': { kind: 'single'; scope: 'session' }
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
  }
}

declare module '@deepseek-ai/dsh-client-ui-settings/client' {
  /** Snapshot of one durable namespace scope, as the settings card reads it. */
  export interface SettingsScopeSnapshot<T> {
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

  /** Durable namespace scope owner used by the settings card. */
  export interface SettingsScope<T> {
    getSnapshot(): SettingsScopeSnapshot<T>
    subscribe(listener: () => void): () => void
    set(field: string, value: unknown): Promise<void>
    unset(field: string): Promise<void>
  }

  /** Context merge providing namespace binding. */
  export interface SettingsScopeFace {
    bind<T>(spec: { namespace: string; decode?: (section: unknown) => T | undefined }): SettingsScope<T>
  }
}

/**
 * The harness's shared model-directory faces (owned by the
 * `dsh-client-ui-model-selection` module). Declared as global ambient types:
 * the service reaches the plugin through a deferred cordis inject (present
 * when the module ships with the host), and harness lines without the module
 * simply never fire the inject — the shipped model selector stays untouched.
 */
interface ModelSnapshotStore<T> {
  subscribe(listener: () => void): () => void
  getSnapshot(): T
}

/** One model catalog entry as the directory state carries it. */
interface ModelDirectoryModel {
  id: string
  name: string
  description?: string
  reasoning?: {
    efforts: { id: string; name: string; description?: string }[]
    defaultEffort?: string
  }
}

/** One provider group of the model catalog. */
interface ModelDirectoryGroup {
  id: string
  name?: string
  label?: string
  models: ModelDirectoryModel[]
}

/** The shared model directory state snapshot. */
interface ModelDirectoryState {
  status: 'loading' | 'ready'
  groups: ModelDirectoryGroup[]
  current: { provider: string; model: string; reasoningEffort?: string } | null
  error: string | null
}

/** One session's model directory: shared store + load + route select. */
interface ModelDirectoryFace {
  store: ModelSnapshotStore<ModelDirectoryState>
  load(): Promise<void>
  select(selection: { provider: string; model: string; reasoningEffort?: string }): Promise<void>
}

/** The `modelDirectories` service face, keyed by session id. */
interface ModelDirectoriesFace {
  directoryFor(sessionId: string): ModelDirectoryFace
}

/**
 * The narrow `sessions` face `directoryFor` needs. Declared because the
 * resolver resolves `this.ctx.sessions` against the ACCESSING context (cordis
 * traceable services rebind `ctx` to the reader): any fiber that calls
 * `directoryFor` must declare these services itself or the call throws.
 */
interface SessionsFace {
  scope(sessionId: string): unknown
  binding(sessionId: string): unknown
}
