/**
 * The structural settings face the model panel consumes. On the 0.1.5 line the
 * `SettingsScope` type is still exported by
 * `@deepseek-ai/dsh-client-ui-settings/client` (the `settingsScope.bind`
 * product), so the panel re-uses that declaration directly.
 */
export type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
