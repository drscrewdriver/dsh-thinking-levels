/**
 * Panel probe v2: realistic directory store (groups incl. synced providers).
 */
import React from 'react'
import TestRenderer from 'react-test-renderer'
import { ModelPanel } from '../src/client/model-panel.tsx'

process.on('exit', () => console.log('[panel-probe] exit'))

let warns = 0
let errs = 0
for (const level of ['warn', 'error'] as const) {
  const orig = console[level].bind(console)
  console[level] = (...args: unknown[]) => {
    const n = level === 'warn' ? ++warns : ++errs
    if (n < 3) {
      console.log(`[panel-probe] ${level}#${n}:`, args.map(a => {
        if (typeof a === 'string') return a.slice(0, 1500)
        if (a && (a as { stack?: string }).stack) return String((a as { stack?: string }).stack).slice(0, 3000)
        return String(a).slice(0, 300)
      }).join(' | '))
    }
    orig(...args)
  }
}

const providers = {
  xiaomi: {
    apiKeyEnv: 'XIAOMI_API_KEY',
    models: [
      { id: 'mimo-v2.5', name: 'mimo-v2.5', contextWindow: 524288, input: ['text', 'image'], reasoningEfforts: { off: null, high: 'high' }, compat: { supportsReasoningEffort: false } },
      { id: 'mimo-v2.6-flash', name: 'mimo-v2.6-flash' },
    ],
    defaultInput: ['text'],
  },
  'local-35b': {
    displayName: 'local-35b',
    apiKeyEnv: 'LOCAL_35B_API_KEY',
    api: 'openai-completions',
    baseURL: 'http://192.168.100.242:8200/v1',
    models: [
      { id: 'Qwen3.6-35B-A3B', name: 'Qwen3.6-35B-A3B', contextWindow: 250000, input: ['text', 'image'], reasoningEfforts: { off: null, high: 'high' }, compat: { supportsReasoningEffort: false, thinkingFormat: 'qwen-chat-template' } },
      { id: 'Qwen38-27B', name: 'Qwen38-27B', input: ['text', 'image'], reasoningEfforts: { off: null, low: 'low', high: 'high', xhigh: 'xhigh' }, compat: { supportsReasoningEffort: true, thinkingFormat: 'qwen-chat-template' } },
    ],
    compat: { chatTemplateKwargs: {}, supportsDeveloperRole: false },
    defaultInput: ['text'],
  },
}

const piAiSnapshot = {
  status: 'ready' as const,
  value: { enabled: true, level: 'auto', allowDowngrade: true, allowUpgrade: false, takeover: false, models: {} },
  revision: 1, writable: true, base: {}, user: { providers }, mode: 'host' as const,
}
const dsSnapshot = {
  status: 'ready' as const,
  value: { models: [{ id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', contextWindow: 1000000, inputModalities: ['text'] }] },
  revision: 1, writable: true, base: {}, user: {}, mode: 'host' as const,
}
const dirState = {
  status: 'ready' as const,
  error: null,
  current: { provider: 'llm-deepseek', model: 'deepseek-flash', reasoningEffort: 'high', name: 'DeepSeek-V41-Flash' },
  groups: [
    { id: 'llm-deepseek', models: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', reasoning: { defaultEffort: 'high', efforts: ['off', 'high'] } },
      { id: 'deepseek-flash', name: 'DeepSeek-V41-Flash', reasoning: { defaultEffort: 'high', efforts: ['off', 'low', 'medium', 'high'] } },
    ] },
    { id: 'xiaomi', models: [
      { id: 'mimo-v2.5', name: 'mimo-v2.5', reasoning: { defaultEffort: 'high', efforts: ['off', 'high'] } },
      { id: 'mimo-v2.6-flash', name: 'mimo-v2.6-flash' },
    ] },
    { id: 'local-35b', models: [
      { id: 'Qwen3.6-35B-A3B', name: 'Qwen3.6-35B-A3B', reasoning: { defaultEffort: 'high', efforts: ['off', 'high'] } },
      { id: 'Qwen38-27B', name: 'Qwen38-27B', reasoning: { defaultEffort: 'high', efforts: ['off', 'low', 'high', 'xhigh'] } },
    ] },
  ],
}
const directory = {
  store: { subscribe: () => () => {}, getSnapshot: () => dirState },
  load: () => {},
  select: () => {},
}
function inertScope(snap: unknown) {
  const frozen = snap
  return {
    getSnapshot: () => frozen,
    subscribe: () => () => {},
    set: () => Promise.resolve(true),
    unset: () => Promise.resolve(true),
  }
}

console.log('[panel-probe] rendering...')
try {
  TestRenderer.act(() => {
    TestRenderer.create(
      <ModelPanel
        directory={directory as never}
        piAiScope={inertScope(piAiSnapshot) as never}
        deepseekScope={inertScope(dsSnapshot) as never}
        sessionId="s1"
        t={(key) => key}
      />,
    )
  })
  console.log('[panel-probe] created OK — warns:', warns, 'errs:', errs)
} catch (error) {
  const e = error as Error
  console.log('[panel-probe] threw:', e.message)
  console.log('[panel-probe] stack:', e.stack?.slice(0, 3000))
}
setTimeout(() => { console.log('[panel-probe] done — warns:', warns, 'errs:', errs); process.exit(0) }, 1500)
