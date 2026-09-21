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
/** How many recent tool calls to sample for one decision. */
export const TOOL_SAMPLE_WINDOW = 8;
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
/**
 * Resolve the installed harness's event-log accessor, newest API first.
 * @param session - the `agent.session` value.
 * @returns the log view, or `undefined` when no accessor can be read — which
 *   is deliberately distinct from a log that is readable and empty.
 */
function eventLogOf(session) {
    try {
        // Current harness (>= 0.1.2-rc.1): random access, no array materialization.
        const eventAt = session.eventAt;
        const seq = session.seq;
        if (typeof eventAt === 'function' && typeof seq === 'number' && Number.isFinite(seq) && seq >= 0) {
            const read = eventAt;
            return { length: seq, at: index => read.call(session, index) };
        }
        // Same segment, bulk accessors. `snapshotEvents()` is the full log,
        // `ownEvents()` the fork-owned suffix; the harness caches the full
        // snapshot until the next append.
        for (const accessor of ['snapshotEvents', 'ownEvents']) {
            const read = session[accessor];
            if (typeof read !== 'function')
                continue;
            const events = read.call(session);
            if (Array.isArray(events))
                return { length: events.length, at: index => events[index] };
        }
        // Pre-rename harness (0.1.2-alpha.*): a plain array member.
        const legacy = session.events;
        if (Array.isArray(legacy))
            return { length: legacy.length, at: index => legacy[index] };
    }
    catch {
        // A session shape whose accessors throw is unreadable, not empty.
        return undefined;
    }
    return undefined;
}
/** Guard: one session event shaped like a tool/call record. */
function isToolCallEvent(event) {
    if (!isRecord(event) || event.type !== 'tool/call')
        return false;
    return isRecord(event.data);
}
/** Approximate argument size in characters (payload heft); unknown shapes read as 0. */
function argsSizeOf(argumentsValue) {
    return typeof argumentsValue === 'string' ? argumentsValue.length : 0;
}
/**
 * Guard: a tool result that reports failure. A dsh `tool/result` carries its
 * blocks under `data.message.content`, and each tool-result block sets
 * `isError: true` when the call failed. Flatter shapes are accepted too rather
 * than assumed absent.
 */
function isFailedToolResult(event) {
    if (!isRecord(event) || event.type !== 'tool/result')
        return false;
    const data = event.data;
    if (!isRecord(data))
        return false;
    if (data.isError === true)
        return true;
    const outcome = data.outcome;
    if (isRecord(outcome) && (outcome.kind === 'error' || outcome.ok === false))
        return true;
    const message = data.message;
    if (!isRecord(message))
        return false;
    const content = message.content;
    if (!Array.isArray(content))
        return false;
    return content.some(block => isRecord(block) && block.isError === true);
}
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
export function recentToolCalls(agent) {
    if (!isRecord(agent))
        return undefined;
    const session = agent.session;
    if (!isRecord(session))
        return undefined;
    const log = eventLogOf(session);
    if (log === undefined)
        return undefined;
    const calls = [];
    let failed = false;
    try {
        for (let index = log.length - 1; index >= 0; index -= 1) {
            const event = log.at(index);
            if (isFailedToolResult(event))
                failed = true;
            if (!isToolCallEvent(event))
                continue;
            const data = event.data;
            const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool';
            calls.push({ name, argsSize: argsSizeOf(data.arguments) });
            if (calls.length >= TOOL_SAMPLE_WINDOW)
                break;
        }
    }
    catch {
        // An accessor that resolves but throws on use (a detached or disposed
        // session) is unreadable, not empty.
        return undefined;
    }
    return { calls: calls.reverse(), failed };
}
