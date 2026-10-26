/**
 * Session tool-call sampling for dsh-thinking-levels.
 *
 * Two readers, one extraction:
 * - {@link toolSampleOf} normalizes a single raw Session event and is shared
 *   with the `tlAutoSchedule` projection (`auto-schedule-projection.ts`), so
 *   the `tool/call` wire shape lives in exactly one place.
 * - {@link recentToolCalls} is the LEGACY pull path. `session.events` only
 *   ever existed on hosts up to 0.1.0-rc.8 (verified: `get events()` present at
 *   `dsh-v0.1.0-rc.8`, zero hits from `dsh-v0.1.2-rc.1` on), so on every newer
 *   line it returns `[]` — which is exactly the issue #6 defect. It survives
 *   only as the 0.1.0-rc.8 fallback for hosts whose projection registry
 *   predates `stateOf`.
 */
import type { ToolCallSample } from './thinking-level.ts';
/** How many recent tool calls to sample for one decision. */
export declare const TOOL_SAMPLE_WINDOW = 8;
/** Approximate argument size in characters (payload heft); unknown shapes read as 0. */
export declare function argsSizeOf(argumentsValue: unknown): number;
/**
 * Normalize one raw Session event into a tool-call sample.
 *
 * @param event - any committed Session event.
 * @returns the sample, or undefined for any other event / malformed record.
 */
export declare function toolSampleOf(event: unknown): ToolCallSample | undefined;
/**
 * LEGACY: recent tool calls off `agent.session.events`, oldest first.
 *
 * Only 0.1.0-rc.8 carries that array property; every host from 0.1.2-rc.1 on
 * drops it in favour of `eventAt()/snapshotEvents()/ownEvents()`, so this
 * returns `[]` there. Callers must treat `[]` as "no samples available" and
 * prefer the projection read.
 *
 * @param agent - the `payload.agent` value from the `agent/request` waterfall.
 * @returns the sampled tool calls, or `[]` for a fresh prompt / unknown shape.
 */
export declare function recentToolCalls(agent: unknown): ToolCallSample[];
