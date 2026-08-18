/**
 * Thinking-levels settings card — the `settings.plugin.item` face of the
 * dsh-thinking-levels plugin.
 *
 * The card binds the `thinking-levels` settings namespace through the
 * `settingsScope` cordis service and renders its four fields: the level picker
 * (off / low / high / max / auto) plus the three scheduler toggles. Every
 * change commits immediately through the scope (no staged form): the decision
 * is read per model request, so a committed change applies to the next request
 * without a restart.
 *
 * Kept dependency-free beyond react: the scope is subscribed with
 * `useSyncExternalStore`, and the controls are plain HTML so the client bundle
 * needs no CSS modules and no primitives value import.
 */
import { useSyncExternalStore } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { EffortId } from '../thinking-level.ts'
import type { ThinkingLevelsConfig } from '../index.ts'

/** One injected face: the bound settings scope for the `thinking-levels` namespace. */
export interface ThinkingLevelsCardInjected {
  scope: SettingsScope<ThinkingLevelsConfig>
}

/** Full props: locale seat + the injected scope. */
export type ThinkingLevelsCardProps = PropsLocale<'thinking-levels'> & ThinkingLevelsCardInjected

/** The five user-facing levels, in picker order. */
const EFFORT_OPTIONS: readonly EffortId[] = ['off', 'low', 'high', 'max', 'auto']

/** Minimal shared row styling (inline; keeps the client bundle CSS-free). */
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '6px 0',
  fontSize: '13px',
  lineHeight: '20px',
}

const labelStyle: CSSProperties = { margin: 0, color: 'var(--dsw-alias-label-primary)' }

const controlStyle: CSSProperties = {
  background: 'var(--dsw-alias-bg-surface, #fff)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '13px',
}

/** One boolean field row (checkbox) bound to the scope. */
function ToggleRow(props: {
  id: string
  label: string
  checked: boolean
  disabled: boolean
  onChange: (next: boolean) => void
}): JSX.Element {
  const { id, label, checked, disabled, onChange } = props
  return (
    <div style={rowStyle}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </div>
  )
}

/**
 * The card body.
 * @param props - locale copy and the injected settings scope.
 */
export function ThinkingLevelsCard({ t, scope }: ThinkingLevelsCardProps): JSX.Element {
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const unavailable = snapshot.status === 'unavailable'
  const readonly = unavailable || !snapshot.writable
  const value = (snapshot.value ?? {}) as Partial<ThinkingLevelsConfig>
  const level = EFFORT_OPTIONS.includes(value.level as EffortId) ? value.level as EffortId : 'auto'

  if (unavailable) {
    return (
      <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--dsw-alias-label-tertiary)' }}>
        {t('card.unavailable')}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={rowStyle}>
        <label htmlFor="plugin-config-thinking-levels-level" style={labelStyle}>{t('card.level')}</label>
        <select
          id="plugin-config-thinking-levels-level"
          value={level}
          disabled={readonly}
          style={controlStyle}
          onChange={(event) => { void scope.set('level', event.currentTarget.value as EffortId) }}
        >
          {EFFORT_OPTIONS.map((option) => (
            <option key={option} value={option}>{t(`card.level.${option}`)}</option>
          ))}
        </select>
      </div>
      <ToggleRow
        id="plugin-config-thinking-levels-enabled"
        label={t('card.enabled')}
        checked={value.enabled ?? true}
        disabled={readonly}
        onChange={(next) => { void scope.set('enabled', next) }}
      />
      <ToggleRow
        id="plugin-config-thinking-levels-downgrade"
        label={t('card.allowDowngrade')}
        checked={value.allowDowngrade ?? true}
        disabled={readonly || value.level !== 'auto'}
        onChange={(next) => { void scope.set('allowDowngrade', next) }}
      />
      <ToggleRow
        id="plugin-config-thinking-levels-upgrade"
        label={t('card.allowUpgrade')}
        checked={value.allowUpgrade ?? false}
        disabled={readonly || value.level !== 'auto'}
        onChange={(next) => { void scope.set('allowUpgrade', next) }}
      />
      {!snapshot.writable && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('card.readonly')}</p>}
    </div>
  )
}
