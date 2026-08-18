/**
 * Local contract declarations for the @deepseek-ai/* platform surfaces the
 * plugin consumes. The npm publication chain for the harness client packages
 * is incomplete (rc.1 placeholders miss several transitive packages), and the
 * plugin never value-imports them anyway — the browser half talks to cordis
 * services and slot registration only, and the loader module table supplies
 * the real modules at runtime.
 *
 * These declarations mirror the harness sources at the anchors listed in
 * README.md (verified 2026-08-19); drift against a future harness release
 * shows up as a slot-registration or type error at build time.
 */

declare module '@deepseek-ai/dsh-client-runtime/client' {
  /** The client root context merge the plugin's browser half receives. */
  export interface ClientContext {
    effect(cleanup: () => (() => void) | void, label?: string): void
    on(event: string, listener: (...args: never[]) => unknown, options?: unknown): () => void
    get<T>(key: string): T | undefined
    slots: import('@deepseek-ai/dsh-client-ui-slots').SlotsFace
    locale: import('@deepseek-ai/dsh-client-locale/client').LocaleFace
    settingsScope: import('@deepseek-ai/dsh-client-ui-settings/client').SettingsScopeFace
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  /** Slot map entries consumed by this plugin (subset of the harness table). */
  export interface SlotMap {
    'settings.plugin.item': { kind: 'keyed'; scope: 'root'; owner: object }
  }

  /** Locale namespaces merged by client plugins. */
  export interface LocaleNamespaceMap {
    'thinking-levels': string
  }

  /** Translate thunk bound to one dictionary namespace. */
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
  /** Dictionary registration and bound-translate face. */
  export interface LocaleFace {
    register(namespace: string, dictionaries: Record<string, Record<string, string>>): void
    bind<N extends string>(namespace: N): (key: string, params?: Record<string, unknown>) => string
  }
}

declare module '@deepseek-ai/dsh-client-ui-settings/client' {
  /** Durable namespace scope owner used by the settings card. */
  export interface SettingsScope<T> {
    getSnapshot(): { status: 'loading' | 'ready' | 'unavailable'; value: T | undefined; writable: boolean; mode: 'host' | 'memory' }
    subscribe(listener: () => void): () => void
    set(field: string, value: unknown): Promise<void>
    unset(field: string): Promise<void>
  }

  /** Context merge providing namespace binding. */
  export interface SettingsScopeFace {
    bind<T>(spec: { namespace: string }): SettingsScope<T>
  }
}
