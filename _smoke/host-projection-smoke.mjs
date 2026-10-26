/**
 * Out-of-tree host integration smoke (issue #6) — NOT part of `npm test`.
 *
 * Proves the `tlAutoSchedule` unit against the REAL published host packages,
 * which the plugin deliberately does not depend on (no new peer/devDep):
 *
 *   mkdir -p /tmp/proj-itest && cd /tmp/proj-itest
 *   npm init -y && npm i @deepseek-ai/dsh-session@0.2.1-rc.3 \
 *     @deepseek-ai/dsh-session-projection@0.2.1-rc.3 @deepseek-ai/cordis@4 zod@4
 *   cp <this file> . && node host-projection-smoke.mjs
 *
 * Expected (0.2.1-rc.3, 2026-10-27):
 *   session.events === undefined            ← bug 1 premise: the legacy array is gone
 *   initial      = {"samples":[],"userEffort":null}
 *   after #1     = {"samples":[{"name":"bash","argsSize":6}],"userEffort":"auto"}
 *   after ring   = 8 samples, oldest dropped (t4 … t11)
 *   readAutoSchedule (real service) = folded state
 *
 * Edit IMPORT to point at this repo's built `lib/` before running.
 */
import { Context } from '@deepseek-ai/cordis'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import { SessionProjectionRegistry } from '@deepseek-ai/dsh-session-projection'
import {
  AUTO_SCHEDULE_KEY,
  buildAutoScheduleDefinition,
  readAutoSchedule,
  requestedEffortOf,
} from 'file:///E:/test/rewrite-agently/mine-dsh-plugins/dsh-thinking-levels/lib/auto-schedule-projection.js'

const ctx = new Context()
const session = Session.create(SessionId('itest-issue6'), [])

console.log('session.events ===', session.events)
console.log('has eventAt/snapshotEvents/ownEvents =',
  typeof session.eventAt, typeof session.snapshotEvents, typeof session.ownEvents)

const registry = new SessionProjectionRegistry(ctx)
registry.register(buildAutoScheduleDefinition())

const read = () => registry.stateOf(session, AUTO_SCHEDULE_KEY)
console.log('initial    =', JSON.stringify(read()))
console.log('readAutoSchedule (no service) =', readAutoSchedule({ get: () => undefined }, session))

session.append('tool/call', { turn: 1, step: 1, callId: 'c1', name: 'bash', arguments: 'ls -la' })
session.append('model/selection', { provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'auto' })
console.log('after #1   =', JSON.stringify(read()))

session.append('tool/call', { turn: 1, step: 2, callId: 'c2', name: 'mcp__docs', arguments: 'x'.repeat(4000) })
console.log('after #2   =', JSON.stringify(read()))

for (let i = 0; i < 12; i += 1) {
  session.append('tool/call', { turn: 1, step: 3, callId: `c${3 + i}`, name: `t${i}`, arguments: 'y' })
}
const folded = read()
console.log('after ring =', JSON.stringify({ count: folded.samples.length, first: folded.samples[0], last: folded.samples.at(-1) }))
console.log('requestedEffortOf =', requestedEffortOf(folded, 'low'))
console.log('readAutoSchedule (real service) =', JSON.stringify(readAutoSchedule({ get: n => (n === 'sessionProjections' ? registry : undefined) }, session)))
