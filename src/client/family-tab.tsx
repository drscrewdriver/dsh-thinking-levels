/**
 * FamilySettingsTab — the body of the plugin-family shared settings tab.
 *
 * Renders this plugin's own thinking-levels card, then the `dsh-family.tab`
 * child slot this tab entry declares: sibling plugins (session-guard first)
 * contribute their cards there via `ctx.slots.inject('dsh-family.tab', …)`.
 * The child slot renders nothing while no contributor is registered, so the
 * tab degrades to this plugin's card alone.
 */
import type { JSX, ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { ThinkingLevelsCard, type ThinkingLevelsCardInjected } from './card.tsx'

/** The framework-delivered child-slot dispatcher, narrowed to our one child key. */
interface FamilyRenderSlots {
  renderSlot(key: 'dsh-family.tab', owner?: object, opts?: { fallback?: ReactNode }): ReactNode
}

/** Full props: locale seat + injected card face + the child-slot dispatcher. */
export type FamilySettingsTabProps = PropsLocale<'thinking-levels'> & ThinkingLevelsCardInjected & FamilyRenderSlots

export function FamilySettingsTab(props: FamilySettingsTabProps): JSX.Element {
  const { renderSlot } = props
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <ThinkingLevelsCard {...props} />
      {renderSlot('dsh-family.tab', {}, { fallback: null })}
    </div>
  )
}
