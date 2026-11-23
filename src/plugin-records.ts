/**
 * Durable marks for the scheduler's OWN `model/selection` writes.
 *
 * ## The problem this solves
 *
 * On the 0.2.2+ strict line this plugin is itself a `model/selection` writer:
 * it fixes the next step's level through `agent.model.select()` (or by rewriting
 * the step's captured selection). Those writes do NOT reach the session log —
 * the host only appends `model/selection` for an explicit user pick
 * (`api/session-controller/src/commands.ts:176` → `selectForNextRequest`).
 *
 * Measured live (session `7f321902`): ONE `model/selection` event against THIRTY
 * `request/header` events alternating high/low. A projection folded over the log
 * alone therefore cannot tell "the user chose low" from "the scheduler chose
 * low", and the first honest answer was `unknown` — truthful, but useless: it
 * cannot distinguish scheduler output from a genuinely unexplained change.
 *
 * ## The mechanism
 *
 * `@deepseek-ai/dsh-session` exposes `appendPluginRecord(session, type, data)`
 * for exactly this: an `ignorable` event under a `plugin:`-namespaced type that
 * never enters the model-visible surface, is retained across fork/resume, and is
 * skipped (not refused) by readers that do not know it. We append one record per
 * scheduler write, so the projection can attribute the following
 * `request/header` to the scheduler.
 *
 * ## Coupling rules
 *
 * - **Soft**: the host package is resolved with a dynamic `import()` at call
 *   time and every failure degrades to "no mark" (the projection then keeps its
 *   `unknown` attribution). A plugin must never take a turn down because an
 *   optional telemetry channel is missing (`agent-loop/README.md:128`).
 * - **Never throws**: the caller is mid-turn; a rejected append would abort the
 *   step. All paths are wrapped.
 * - **Probed once**: the first attempt logs whether the API was reachable, so a
 *   silent degradation is diagnosable from the host log instead of by guessing.
 * @module dsh-thinking-levels/plugin-records
 */

/**
 * The record type. `plugin:` + slash-separated lowercase segments, per the
 * host grammar (`PluginRecordType` in `dsh-session/types`).
 */
export const SCHEDULER_WRITE_RECORD = 'plugin:dsh-thinking-levels/scheduler-write'

/** Payload of one scheduler-write mark. */
export interface SchedulerWriteRecord {
  /** The level this plugin wrote (absent when it cleared the effort). */
  level?: string
  /** `true` when the write removed the effort instead of setting one. */
  clear?: boolean
  /** The intent the scheduler resolved for this step, for diagnosis. */
  intent?: string
  /** Provider/model route the write targeted. */
  provider?: string
  model?: string
  /** `step` when the write landed on the current step, `next` when deferred. */
  applied?: 'step' | 'next'
}

/** The shape of the host's `appendPluginRecord` export. */
type AppendPluginRecord = (session: unknown, type: string, data: unknown) => unknown

/** Cached module namespace, so the dynamic import runs at most once per process. */
let recordsModule: { appendPluginRecord?: AppendPluginRecord } | undefined
/** Whether the capability probe already ran (log once, not per request). */
let probed = false
/** Whether the API is reachable; `undefined` until the first probe settles. */
let available: boolean | undefined

/**
 * Resolve the host session package and its `appendPluginRecord` export.
 *
 * The package is installation-scoped, so the host's runtime resolution answers
 * it for any profile plugin (the plugin does not need it in its own
 * `node_modules`, and does not declare it as a hard peer).
 *
 * The specifier is held in a variable on purpose: a literal
 * `import('@deepseek-ai/dsh-session')` would make the package a hard
 * compile-time dependency of this plugin, and it is deliberately optional —
 * older hosts do not export the API at all, and the plugin must still install
 * there. `tsc` therefore never type-checks the module's shape; the narrow
 * structural interface below is the contract.
 * @returns the append function, or undefined when unreachable.
 */
async function loadAppendPluginRecord(): Promise<AppendPluginRecord | undefined> {
  if (recordsModule !== undefined) return recordsModule.appendPluginRecord
  try {
    const specifier = '@deepseek-ai/dsh-session'
    const namespace = await import(/* @vite-ignore */ specifier) as { appendPluginRecord?: AppendPluginRecord }
    recordsModule = namespace
    return typeof namespace.appendPluginRecord === 'function' ? namespace.appendPluginRecord : undefined
  } catch {
    // Unreachable on this host line: remember the miss so every later write
    // short-circuits instead of retrying the import per step.
    recordsModule = {}
    return undefined
  }
}

/**
 * Append one scheduler-write mark to the session log.
 *
 * Best-effort by construction: an absent API, a non-appendable session, a
 * rejected payload or a throwing host all resolve to `false` — never a
 * rejection — because the caller is in the middle of a turn.
 * @param session - the live Session the write applies to (`agent.session`).
 * @param record - what was written.
 * @param logger - optional host logger, used once for the capability probe.
 * @returns whether the mark was committed.
 */
export async function markSchedulerWrite(
  session: unknown,
  record: SchedulerWriteRecord,
  logger?: { info?: (message: string, ...args: unknown[]) => void; warn?: (message: string, ...args: unknown[]) => void },
): Promise<boolean> {
  if (typeof session !== 'object' || session === null) return false
  const append = await loadAppendPluginRecord()
  if (!probed) {
    probed = true
    available = append !== undefined
    // One line, at the first write: a silently unmarked trace is otherwise
    // indistinguishable from a scheduler that never wrote anything. The log
    // call is guarded — a hostile/throwing logger must not turn a best-effort
    // mark into a rejected step.
    const line = '[thinking-levels] plugin-record channel %s (scheduler-write marks)'
    try {
      if (append === undefined) logger?.warn?.(line, 'unavailable — scheduler writes stay unmarked')
      else logger?.info?.(line, 'ready')
    } catch { /* diagnostics only */ }
  }
  if (append === undefined) return false
  try {
    append(session, SCHEDULER_WRITE_RECORD, {
      ...record.level === undefined ? {} : { level: record.level },
      ...record.clear === true ? { clear: true } : {},
      ...record.intent === undefined ? {} : { intent: record.intent },
      ...record.provider === undefined ? {} : { provider: record.provider },
      ...record.model === undefined ? {} : { model: record.model },
      ...record.applied === undefined ? {} : { applied: record.applied },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Read one committed event as a scheduler-write mark.
 *
 * Duck-typed on purpose: the projection folds raw events and must recognize the
 * mark on any host line without importing host types.
 * @param event - any committed session event.
 * @returns the record payload, or undefined for any other event.
 */
export function schedulerWriteOf(event: unknown): SchedulerWriteRecord | undefined {
  if (typeof event !== 'object' || event === null) return undefined
  const candidate = event as { type?: unknown; ignorable?: unknown; data?: unknown }
  if (candidate.type !== SCHEDULER_WRITE_RECORD) return undefined
  const data = candidate.data
  if (typeof data !== 'object' || data === null) return undefined
  const record = data as Record<string, unknown>
  const level = record['level']
  const clear = record['clear']
  const intent = record['intent']
  const provider = record['provider']
  const model = record['model']
  const applied = record['applied']
  return {
    ...typeof level === 'string' && level.length > 0 ? { level } : {},
    ...clear === true ? { clear: true } : {},
    ...typeof intent === 'string' ? { intent } : {},
    ...typeof provider === 'string' ? { provider } : {},
    ...typeof model === 'string' ? { model } : {},
    ...applied === 'step' || applied === 'next' ? { applied } : {},
  }
}

/** Whether the capability probe has run and what it found (diagnostics/tests). */
export function schedulerMarkChannel(): 'ready' | 'unavailable' | 'unprobed' {
  if (available === undefined) return 'unprobed'
  return available ? 'ready' : 'unavailable'
}

/** Test seam: forget the cached module and probe state. */
export function resetSchedulerMarkChannel(): void {
  recordsModule = undefined
  probed = false
  available = undefined
}
