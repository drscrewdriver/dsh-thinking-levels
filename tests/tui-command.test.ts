import { describe, it, expect } from 'vitest'
import { runThinkCommand, renderLines, type ThinkCommandDeps } from '../src/tui-command.ts'

function deps(overrides: Partial<ThinkCommandDeps> = {}): ThinkCommandDeps {
  return {
    state: () => ({
      enabled: true,
      level: 'auto',
      allowDowngrade: true,
      allowUpgrade: false,
      takeover: false,
      source: 'composition-entry',
    }),
    write: async () => ({ ok: true }),
    ...overrides,
  }
}

describe('/think command', () => {
  it('空参数显示当前档位与调度开关', async () => {
    const result = await runThinkCommand('', deps())
    expect(result.kind).toBe('success')
    expect(result.text).toContain('think — auto')
    expect(result.text).toContain('downgrade=on')
  })

  it('未知档位给可选清单', async () => {
    const result = await runThinkCommand('turbo', deps())
    expect(result.kind).toBe('error')
    expect(result.text).toContain('未知档位')
    expect(result.text).toContain('next: /think')
  })

  it('写操作默认 dry，不落盘', async () => {
    let written = 0
    const result = await runThinkCommand('high', deps({ write: async () => { written += 1; return { ok: true } } }))
    expect(result.text).toContain('dry run')
    expect(written).toBe(0)
  })

  it('--yes 才写回，并回执新档位', async () => {
    const seen: string[] = []
    const result = await runThinkCommand('high --yes', deps({ write: async (level) => { seen.push(level); return { ok: true } } }))
    expect(seen).toEqual(['high'])
    expect(result.text).toContain('已切换到 high')
  })

  it('写失败时给下一步', async () => {
    const result = await runThinkCommand('low --yes', deps({ write: async () => ({ ok: false, reason: 'settings 服务不可用' }) }))
    expect(result.kind).toBe('error')
    expect(result.text).toContain('settings 服务不可用')
    expect(result.text).toContain('设置页')
  })

  it('--json 单行输出', async () => {
    const result = await runThinkCommand('--json', deps())
    expect(result.text.includes('\n')).toBe(false)
    expect(JSON.parse(result.text).data.level).toBe('auto')
  })

  it('超过 40 行时裁剪提示', () => {
    expect(renderLines(Array.from({ length: 45 }, () => 'x')).split('\n').pop()).toContain('--all')
  })
})
