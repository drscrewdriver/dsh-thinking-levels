/**
 * Session tool-call sampling for dsh-thinking-levels.
 *
 * Pulled out of the plugin body so the extraction logic — the part most
 * exposed to dsh event-shape drift — is unit-testable in isolation, with
 * explicit guards instead of naked type assertions.
 *
 * THE CONTRACT THIS MODULE ABSORBS. The harness renamed the session-log
 * accessor at the `0.1.2-rc.1` boundary, and this plugin's `engines.dsh`
 * (`>=0.1.2-alpha.1 <0.2.0-0`) spans both sides of that rename:
 *
 * | harness segment            | session log access                                  |
 * | -------------------------- | --------------------------------------------------- |
 * | `0.1.2-alpha.*`            | `session.events` — a plain array member             |
 * | `0.1.2-rc.1` … `0.1.5-*`   | `session.eventAt(seq)` + `session.snapshotEvents()` |
 * | (current)                  | / `session.ownEvents()` — no `events` member at all |
 *
 * Verified against the published packages: `Session.prototype` carries an
 * `events` accessor in `0.1.2-alpha.2` and does not in `0.1.2-rc.1` or
 * `0.1.5-rc.2`. Reading only `session.events` therefore samples nothing on
 * every harness from `0.1.2-rc.1` on, and an empty sample is what the
 * scheduler reads as "no work worth thinking about".
 */
import type { ToolHistory } from './thinking-level.ts';
/** How many recent tool calls to sample for one decision. */
export declare const TOOL_SAMPLE_WINDOW = 8;
/**
 * Sample a session's log for the auto scheduler: the most recent tool calls of
 * the current step (oldest first) and whether any tool round in the same window
 * reported a failure. Non-tool events and malformed records are skipped; at
 * most {@link TOOL_SAMPLE_WINDOW} call samples are returned.
 *
 * @param agent - the `payload.agent` value from the `agent/request` waterfall.
 * @returns the sampled window, or `undefined` when the session log cannot be
 *   read at all. "Cannot observe" must never be passed off as "nothing heavy
 *   happened" — `undefined` is how the scheduler tells the two apart.
 */
export declare function recentToolCalls(agent: unknown): ToolHistory | undefined;
