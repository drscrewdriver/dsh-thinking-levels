/**
 * TL auto-schedule projection unit (`tlAutoSchedule`).
 *
 * Issue #6 background — the two defects this unit exists to fix:
 * - The scheduler sampled tool calls from `agent.session.events`, an array
 *   property that only existed on 0.1.0-rc.8. From 0.1.2-rc.1 onward the host
 *   exposes `eventAt()/snapshotEvents()/ownEvents()` instead, so the sampler
 *   returned `[]` on 13 of the 14 supported host lines and `auto` silently
 *   collapsed to `low`. Those three readers are now `@deprecated` with an
 *   explicit "new production calls are prohibited" policy
 *   (`packages/core/session/README.md:62`), so re-binding to them is not an
 *   option either.
 * - The host seeds every request's `reasoningEffort` from the previous
 *   `request/header`, i.e. from THIS plugin's own output
 *   (`core/agent-loop/src/agent.ts:573-581`), so treating a concrete seed as a
 *   manual pick froze `auto` after the first request of a session.
 *
 * Both are solved by reading/writing a Session projection instead of the log:
 * - `apply` folds `tool/call` events into a bounded ring → `samples`.
 * - `apply` folds `model/selection` events into `userEffort`. That event has
 *   exactly one production writer, the user-facing selection command
 *   (`api/session-controller/src/agent.ts:340` ← `commands.ts:176`), so the
 *   plugin's own injection can never pollute it — the echo disappears by
 *   construction and needs no "remember what I injected" side table.
 *
 * Projections are the sanctioned read path ("reads the projection"), are
 * folded lazily over the in-memory log on first read (so resumed/forked
 * sessions are complete), and cost O(1) per request afterwards.
 *
 * Explicitly NOT used: the host's `modelSelection` projection. Its `lastUsed`
 * is rewritten on every `request/header` (i.e. it holds this plugin's own
 * output) and `pending` is cleared once a matching header commits
 * (`api/session-controller/src/model-selection-projection.ts:39-58`), so
 * neither field carries a durable user intent.
 * @module dsh-thinking-levels/auto-schedule-projection
 */
import { z } from 'zod'
import { TOOL_SAMPLE_WINDOW, toolSampleOf } from './session-events.ts'
import { isEffortId, type EffortId, type ToolCallSample } from './thinking-level.ts'

/** Projection key. `tl` matches the plugin's other unit (`tlCacheBilling`). */
export const AUTO_SCHEDULE_KEY = 'tlAutoSchedule'

/** Folded state: recent tool samples plus the session's explicit pick. */
export interface AutoScheduleState {
  /** Recent `tool/call` samples, oldest first, at most {@link TOOL_SAMPLE_WINDOW}. */
  samples: readonly ToolCallSample[]
  /** Effort explicitly picked in this session, or null when never picked. */
  userEffort: string | null
}

const stateSchema = z.object({
  samples: z.array(z.object({ name: z.string(), argsSize: z.number() })),
  userEffort: z.string().nullable(),
})

/** Initial folded state (also the shape every cold read starts from). */
const initAutoSchedule = (): AutoScheduleState => ({ samples: [], userEffort: null })

/**
 * Fold one committed Session event into the auto-schedule state.
 *
 * Unrelated events return the SAME reference — the projection registry gates
 * its change feed on `Object.is`, so rebuilding state for every message would
 * wake every client-visible unit on each append.
 *
 * @param state - state before the event.
 * @param event - next committed Session event (raw wire shape; narrowed below).
 * @returns the original or advanced state.
 */
export function applyAutoSchedule(state: AutoScheduleState, event: unknown): AutoScheduleState {
  if (typeof event !== 'object' || event === null) return state
  const type = (event as { type?: unknown }).type
  if (type === 'tool/call') {
    const sample = toolSampleOf(event)
    if (sample === undefined) return state
    const grown = [...state.samples, sample]
    const samples = grown.length > TOOL_SAMPLE_WINDOW
      ? grown.slice(grown.length - TOOL_SAMPLE_WINDOW)
      : grown
    return { ...state, samples }
  }
  if (type === 'model/selection') {
    const data = (event as { data?: unknown }).data
    const raw = typeof data === 'object' && data !== null
      ? (data as { reasoningEffort?: unknown }).reasoningEffort
      : undefined
    const userEffort = typeof raw === 'string' && raw.length > 0 ? raw : null
    return userEffort === state.userEffort ? state : { ...state, userEffort }
  }
  return state
}

/**
 * Build the `tlAutoSchedule` projection definition. Registered soft-coupled
 * (runtime inject), exactly like `tlCacheBilling`: hosts whose registry cannot
 * serve `stateOf` simply never register it and the scheduler falls back to the
 * legacy array read.
 */
export function buildAutoScheduleDefinition() {
  return {
    key: AUTO_SCHEDULE_KEY,
    stateVersion: 1,
    stateSchema,
    init: initAutoSchedule,
    apply: applyAutoSchedule,
  }
}

/** The one service surface this unit needs (duck-typed to stay version-agnostic). */
interface ProjectionReader {
  stateOf?: (session: unknown, key: string) => unknown
}

/**
 * Read the folded auto-schedule state for a session.
 *
 * Returns `undefined` — never throws — when the host cannot serve it: the
 * service is absent, or the registry predates `stateOf` (0.1.0-rc.8 is the
 * legacy plane-contract registry with `schema`/`view` and no `stateOf`). A
 * thrown error here would take down the whole turn
 * (`agent-loop/README.md:128`: "plugin failure ends the turn").
 *
 * @param ctx - plugin context (only `get` is used).
 * @param session - the live session owning the state.
 * @returns the folded state, or undefined when unavailable.
 */
export function readAutoSchedule(
  ctx: { get?: (name: string) => unknown },
  session: unknown,
): AutoScheduleState | undefined {
  if (typeof session !== 'object' || session === null) return undefined
  try {
    const service = ctx.get?.('sessionProjections') as ProjectionReader | undefined
    if (typeof service?.stateOf !== 'function') return undefined
    const state = service.stateOf(session, AUTO_SCHEDULE_KEY)
    return typeof state === 'object' && state !== null ? state as AutoScheduleState : undefined
  } catch {
    return undefined
  }
}

/**
 * The level this request was asked for: the session's explicit pick when it is
 * a level the plugin understands, else the plugin-configured default.
 *
 * Note the `isEffortId` gate is deliberate and matches the pre-existing
 * behaviour: a gateway-specific wire value (e.g. `ultra`) inside a concrete
 * pick already fell through to the scheduler before this change, because
 * `resolveEffortInjection` only passes through known effort ids.
 *
 * @param state - folded state, when the host could serve it.
 * @param fallback - configured default level.
 * @returns the requested level.
 */
export function requestedEffortOf(
  state: AutoScheduleState | undefined,
  fallback: EffortId,
): EffortId {
  const user = state?.userEffort
  return isEffortId(user) ? user : fallback
}
