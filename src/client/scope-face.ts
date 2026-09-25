/**
 * 0.1.7-rc.2 stopped exporting `SettingsScope` from
 * `@deepseek-ai/dsh-client-ui-settings/client`; the structural face the card
 * consumes lives here instead. Mirrors the 0.1.7 `ConfigForm` handle
 * (`configForms.get(entryId)`) field-for-field.
 */
export interface SettingsScope<T> {
  getSnapshot(): {
    status: 'loading' | 'ready' | 'unavailable'
    value: T | undefined
    revision: number | undefined
    writable: boolean
    base: unknown
    user: unknown
    mode: 'host' | 'memory'
  }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
  unset(field: string): Promise<boolean>
  mutate?(ops: readonly { path: readonly string[]; op: string; value?: unknown }[]): Promise<boolean>
}
