/**
 * FamilySettingsSection — the top-level 「起子插件设置」 settings section.
 *
 * One `settings.section` nav entry (registered by this plugin) whose entry
 * declares the `dsh-family.tab` child slot; sibling plugins (session-guard
 * first) contribute their cards there via `ctx.slots.inject('dsh-family.tab',
 * …)`. The section renders the family's own thinking-levels card as the first
 * tab and every contributor as a following tab — the same tabs-around-pages
 * pattern the built-in Plugins section uses (ui-settings-plugins): the tab
 * ledger is a HostObservable projected from the child-slot registry, and the
 * active tab mounts through `renderSlot(key, {}, { only: id })`. Each card is
 * a disclosure drawer expanded by default, so an opened tab shows its full
 * panel right away.
 *
 * When this section is absent the whole family surface is absent; a
 * contributor's inject simply idles (an undischarged wait never blocks the
 * client half), so plugins stay fully functional without their card.
 */
import { useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { ThinkingLevelsCard, type ThinkingLevelsCardInjected } from './card.tsx'

/**
 * Structural mirrors of the ui-slots faces this section consumes (the same
 * pattern as scope-face.ts: the package's `export *` type graph resolves
 * unreliably outside the harness workspace, so the handful of shapes are
 * declared locally instead).
 */
type HostObservable<T> = {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** One contributor tab projected from the `dsh-family.tab` ledger. */
export interface FamilyTabEntry {
  id: string
  order: number
  label: string
}

/** Registration-side business face for the section. */
export interface FamilySectionInjected extends ThinkingLevelsCardInjected {
  hooks: {
    /** Ordered projection of the contributor ledger (locale-aware). */
    tabs: HostObservable<readonly FamilyTabEntry[]>
  }
  /** Apply-time EAGER locale binder — the ≤0.1.6 stand-in for the host's
   * PropsLocale delivery (0.1.7+ shells pass `t` and this is ignored). */
  tFallback?: (key: string) => string
  /** Direct-mount face for contributor tabs where the shell delivers no
   * renderSlot (≤0.1.6): mounts the active ledger entry's own component from
   * the raw `ctx.slots.entries` records. Null on any failure. */
  renderContributor?: (id: string) => ReactNode
}

/**
 * The framework-delivered child-slot dispatcher, narrowed to our one child key.
 * Optional: the Plugins-page `plugins.bundle.config` card renders this same
 * component WITHOUT a children declaration (the `dsh-family.tab` child slot is
 * claimed by the settings.section entry alone), so the machinery delivers no
 * renderSlot seat on that surface — contributor tabs degrade to empty panels
 * there instead of crashing on an absent dispatcher.
 */
interface FamilyRenderSlots {
  renderSlot?(key: 'dsh-family.tab', owner?: object, opts?: { only?: string; fallback?: React.ReactNode }): React.ReactNode
}

/** Full props: locale + contributor dispatcher + the resolved inject face. */
export type FamilySettingsSectionProps =
  PropsLocale<'thinking-levels'>
  & FamilyRenderSlots
  & FamilySectionInjected

/** This plugin's own tab, always first: the thinking-levels card itself. */
const OWN_TAB_ID = 'thinking-levels'

const NO_TABS: readonly FamilyTabEntry[] = []

/** The hooks-compartment selector hook face (bound `use<Name>` hook) —
 * delivered by 0.1.7+ shells only; optional for the ≤0.1.6 degraded read. */
interface FamilyHooksFace {
  useTabs?: <S>(selector: (value: readonly FamilyTabEntry[]) => S) => S
}

/**
 * Contributor ledger reader across shell generations. 0.1.7+ shells deliver
 * the hooks compartment (`useTabs`); ≤0.1.6 shells deliver none, so the same
 * projected observable (`hooks.tabs`, injected by the section factory) is read
 * through React's own subscription instead. The face choice is fixed per host
 * (a shell never grows hooks mid-session), so the hook order stays stable per
 * component instance even though the two paths differ.
 */
function useContributorTabs(
  hooksFace: FamilyHooksFace,
  hooksTabs?: HostObservable<readonly FamilyTabEntry[]>,
): readonly FamilyTabEntry[] {
  const [polled, setPolled] = useState<readonly FamilyTabEntry[]>(
    () => hooksTabs?.getSnapshot() ?? NO_TABS,
  )
  useEffect(() => {
    if (hooksFace.useTabs !== undefined || hooksTabs === undefined) return
    return hooksTabs.subscribe(() => setPolled(hooksTabs.getSnapshot()))
  }, [hooksFace, hooksTabs])
  if (hooksFace.useTabs !== undefined) return hooksFace.useTabs(value => value)
  return polled
}

export function FamilySettingsSection(props: FamilySettingsSectionProps): JSX.Element {
  const { t: tHost, renderSlot, scope, piAiScope, ocScope } = props
  // Locale: the host's PropsLocale delivery when present (0.1.7+), the injected
  // EAGER binder when not (≤0.1.6), identity as the last resort — a thrown
  // translate kills the whole section render.
  const t = tHost ?? props.tFallback ?? ((key: string) => key)
  const contributors = useContributorTabs(props as unknown as FamilyHooksFace, props.hooks?.tabs)
  const [activeId, setActiveId] = useState<string>(OWN_TAB_ID)
  const rows = [
    { id: OWN_TAB_ID, order: Number.NEGATIVE_INFINITY, label: t('card.title') },
    ...contributors,
  ]
  const active = rows.some(row => row.id === activeId) ? activeId : OWN_TAB_ID

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div role="tablist" aria-label={t('family.title')} style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '4px' }}>
        {rows.map(row => (
          <button
            key={row.id}
            type="button"
            role="tab"
            aria-selected={row.id === active}
            onClick={() => { setActiveId(row.id) }}
            style={{
              appearance: 'none',
              font: 'inherit',
              cursor: 'pointer',
              flex: '0 0 auto',
              whiteSpace: 'nowrap',
              border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.35))',
              background: row.id === active ? 'var(--dsw-alias-bg-layer-3, rgba(127,127,127,0.08))' : 'none',
              color: 'var(--dsw-alias-label-primary, inherit)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '13px',
            }}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {active === OWN_TAB_ID
          ? <ThinkingLevelsCard t={t} scope={scope} piAiScope={piAiScope} ocScope={ocScope} />
          : renderSlot
            ? renderSlot('dsh-family.tab', {}, { only: active, fallback: null })
            : props.renderContributor?.(active) ?? null}
      </div>
    </div>
  )
}
