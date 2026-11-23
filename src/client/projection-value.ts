/**
 * One helper shared by every client read of a HOST projection face.
 *
 * The host's `ProjectionValueStore` face is built as
 * `{ getSnapshot: () => rows.get(key)?.value, subscribe }` — i.e. `getSnapshot()`
 * returns the projection STATE ITSELF, bare:
 *
 * ```ts
 * binding.session.projections.faceOf('tlAutoSchedule').getSnapshot()
 * // => { samples, userEffort, lastEffective, trace }
 * ```
 *
 * (`packages/api/session-controller/src/client/sessions/projection-store.ts`,
 * `channel()`; every in-tree consumer casts the snapshot straight to its
 * projection type — `faceOf('permissions').getSnapshot() as PermissionSelection`,
 * `faceOf('goal').getSnapshot() as GoalProjection | null | undefined`, ….)
 *
 * The `{ status, value }` wrapper belongs to a DIFFERENT API — the settings
 * handles (`configForms` / `settingsScope`), which is why `card.tsx` /
 * `model-panel.tsx` unwrap `.value` there. Reading a projection face with that
 * assumption yields `undefined` on every real host: the effort tab then renders
 * its empty state ("本会话还没有已提交的请求档位。") while the projection holds a
 * perfectly good trace, and the chip loses `lastEffective` (the issue #11
 * symptom coming back). Verified live on 4.6.0 against a session whose
 * `tlAutoSchedule` row had `[{high,manual,1},{low,manual,1}]`.
 *
 * Both shapes are still accepted, because a patched/older host wrapper or a
 * test double must not turn a cosmetic read into a dead one. The bare state is
 * recognized POSITIVELY — our projection always carries at least one of the
 * four known keys — so a wrapper is never mistaken for state and vice versa.
 */

/** The projection-state keys `tlAutoSchedule` always carries (any one identifies the bare value). */
const STATE_KEYS = ['trace', 'lastEffective', 'userEffort', 'samples'] as const

/**
 * Unwrap one projection face's `getSnapshot()` result into the state record.
 *
 * @param snapshot - the face snapshot, as the host returns it.
 * @returns the projection state, or undefined for an absent/unrecognizable value.
 */
export function projectionValueOf(snapshot: unknown): Record<string, unknown> | undefined {
  if (typeof snapshot !== 'object' || snapshot === null) return undefined
  const record = snapshot as Record<string, unknown>
  for (const key of STATE_KEYS) {
    if (key in record) return record
  }
  // Wrapper shape (`{ value }`) — accepted for older hosts / test doubles.
  const inner = record['value']
  return typeof inner === 'object' && inner !== null ? (inner as Record<string, unknown>) : undefined
}
