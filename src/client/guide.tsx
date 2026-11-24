/**
 * ⚠️ 生成副本 —— 请勿手改。真源：mine-dsh-plugins/_tools/guide-kit/guide.tsx
 * 重新同步：node _tools/guide-kit/sync.mjs
 */
/**
 * guide-kit —— 九插件共用的「首次使用引导」件（**生成副本，勿手改**）。
 *
 * 唯一真源：`mine-dsh-plugins/_tools/guide-kit/guide.tsx`
 * 同步命令：`node _tools/guide-kit/sync.mjs`（会覆盖本文件；改这里等于白改）
 *
 * 六条契约（见 .agents/plans/unified-i18n-onboarding/spec.md §2）：
 * 1. Skip 恒定可见，任何步骤都能退；
 * 2. 永远有字：引导外壳（标题/按钮/步进）自带 10 语词表，按 <html lang> 取词，
 *    认不出的一律落 en；步骤正文按「本语 → en → zh → 任意可用」逐级回退，绝不留空白；
 * 3. 重启入口：`GuideRestartButton`（或自己调 `resetGuide(ns)` + setOpen(true)）就地重开；
 * 4. 零依赖：只 react + localStorage，不 import 平台包，不抢宿主设置表单；
 * 5. 引导自己绝不能成为卡面渲染的失败点：样式注入与存储访问全部 try/catch + 能力探测；
 * 6. 外壳词表与步骤正文分离：外壳跨插件统一（本文件），正文每插件一份 `guide-steps.ts`。
 */
import { useEffect, useState } from 'react'
import type { CSSProperties, JSX } from 'react'

export interface GuideStep {
  title: string
  body: string
}

export interface GuideLabels {
  title: string
  skip: string
  next: string
  prev: string
  done: string
  restart: string
  stepOf: (_current: number, _total: number) => string
}

/** 生态通用的十个语言码（与各插件 `locale/*.json`、README 的十语镜像同口径）。 */
export const GUIDE_LOCALES = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'it', 'ru', 'es', 'pt'] as const
export type GuideLocale = (typeof GUIDE_LOCALES)[number]

/**
 * 引导外壳词表（10 语）。
 *
 * 为什么不塞进各插件 locales：这七个词是**跨插件同一套**，塞进九个字典要重复翻译
 * 9×10 次，且一旦措辞调整就得动九个仓。外壳留在本文件，正文留各插件。
 */
export const GUIDE_COPY: Record<GuideLocale, GuideLabels> = {
  zh: {
    title: '快速上手',
    skip: '跳过引导',
    next: '下一步',
    prev: '上一步',
    done: '开始使用',
    restart: '重新查看引导',
    stepOf: (current, total) => `第 ${current} / ${total} 步`,
  },
  en: {
    title: 'Quick start',
    skip: 'Skip guide',
    next: 'Next',
    prev: 'Back',
    done: 'Get started',
    restart: 'Show guide again',
    stepOf: (current, total) => `Step ${current} of ${total}`,
  },
  ja: {
    title: 'クイックスタート',
    skip: 'ガイドをスキップ',
    next: '次へ',
    prev: '戻る',
    done: 'はじめる',
    restart: 'ガイドをもう一度表示',
    stepOf: (current, total) => `ステップ ${current} / ${total}`,
  },
  ko: {
    title: '빠른 시작',
    skip: '가이드 건너뛰기',
    next: '다음',
    prev: '이전',
    done: '시작하기',
    restart: '가이드 다시 보기',
    stepOf: (current, total) => `${current} / ${total} 단계`,
  },
  fr: {
    title: 'Démarrage rapide',
    skip: 'Ignorer le guide',
    next: 'Suivant',
    prev: 'Retour',
    done: 'Commencer',
    restart: 'Revoir le guide',
    stepOf: (current, total) => `Étape ${current} sur ${total}`,
  },
  de: {
    title: 'Schnellstart',
    skip: 'Anleitung überspringen',
    next: 'Weiter',
    prev: 'Zurück',
    done: 'Loslegen',
    restart: 'Anleitung erneut anzeigen',
    stepOf: (current, total) => `Schritt ${current} von ${total}`,
  },
  it: {
    title: 'Avvio rapido',
    skip: 'Salta la guida',
    next: 'Avanti',
    prev: 'Indietro',
    done: 'Inizia',
    restart: 'Rivedi la guida',
    stepOf: (current, total) => `Passo ${current} di ${total}`,
  },
  ru: {
    title: 'Быстрый старт',
    skip: 'Пропустить руководство',
    next: 'Далее',
    prev: 'Назад',
    done: 'Начать',
    restart: 'Показать руководство снова',
    stepOf: (current, total) => `Шаг ${current} из ${total}`,
  },
  es: {
    title: 'Inicio rápido',
    skip: 'Omitir la guía',
    next: 'Siguiente',
    prev: 'Atrás',
    done: 'Empezar',
    restart: 'Ver la guía de nuevo',
    stepOf: (current, total) => `Paso ${current} de ${total}`,
  },
  pt: {
    title: 'Início rápido',
    skip: 'Ignorar o guia',
    next: 'Próximo',
    prev: 'Voltar',
    done: 'Começar',
    restart: 'Ver o guia novamente',
    stepOf: (current, total) => `Passo ${current} de ${total}`,
  },
}

/** 语言标签 → 语言码：只认主标签，认不出的落 null（由调用方回退 en）。 */
export function normalizeGuideLocale(tag: string): GuideLocale | null {
  const primary = tag.toLowerCase().trim().split(/[-_]/)[0] ?? ''
  return (GUIDE_LOCALES as readonly string[]).includes(primary) ? (primary as GuideLocale) : null
}

function htmlLang(): string {
  try {
    return typeof document === 'undefined' ? '' : (document.documentElement?.lang ?? '')
  } catch {
    return ''
  }
}

/**
 * 当前引导语言：以宿主 `<html lang>` 为准（语言切换会改写这个属性）。
 *
 * 认不出 → en：引导是「帮助」面，宁可给英文也不能给空白或中文硬串。
 */
export function currentGuideLocale(): GuideLocale {
  return normalizeGuideLocale(htmlLang()) ?? 'en'
}

/** 兼容旧调用（1.x 版本只区分 zh/en）：需要细分语种请用 `currentGuideLocale()`。 */
export function guideLang(): GuideLocale {
  return currentGuideLocale()
}

/** 引导外壳取词。 */
export function guideLabels(locale: GuideLocale = currentGuideLocale()): GuideLabels {
  return GUIDE_COPY[locale] ?? GUIDE_COPY.en
}

/**
 * 步骤正文取词：本语 → en → zh → 表里第一个可用。
 *
 * 为什么需要回退链：九插件分批补语种，某个插件可能只有 zh/en 而宿主是 ru；
 * 这时给英文是可用的，给空白等于「引导坏了」。`undefined` 步骤表按空表处理。
 */
export function guideSteps(
  map: Partial<Record<GuideLocale, readonly GuideStep[]>> | undefined,
): readonly GuideStep[] {
  if (map === undefined) return []
  const order: (GuideLocale | undefined)[] = [currentGuideLocale(), 'en', 'zh']
  for (const key of order) {
    const hit = key === undefined ? undefined : map[key]
    if (hit !== undefined && hit.length > 0) return hit
  }
  for (const key of GUIDE_LOCALES) {
    const hit = map[key]
    if (hit !== undefined && hit.length > 0) return hit
  }
  return []
}

function guideStorageKey(ns: string): string {
  return `dsh.guide.${ns}.skipped`
}

/** 是否已跳过（存储不可用时按「未跳过」处理：宁可多教一次，不要静默不教）。 */
export function isGuideSkipped(ns: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(guideStorageKey(ns)) === '1'
  } catch {
    return false
  }
}

/** 记下跳过；写失败不抛（隐私模式 / 存储禁用）。 */
export function skipGuide(ns: string): void {
  try {
    localStorage?.setItem(guideStorageKey(ns), '1')
  } catch {
    /* ignore */
  }
}

/** 清标记 = 允许重新教学。 */
export function resetGuide(ns: string): void {
  try {
    localStorage?.removeItem(guideStorageKey(ns))
  } catch {
    /* ignore */
  }
}

const GUIDE_CSS = `
.sgGuide{border:1px solid var(--dsw-alias-border-l2, rgba(127,127,127,.28));background:var(--dsw-alias-bg-layer-2, rgba(127,127,127,.06));border-radius:12px;padding:14px 16px;margin:0 0 12px}
.sgGuideHead{display:flex;align-items:center;gap:8px;margin:0 0 10px}
.sgGuideTitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary, currentColor)}
.sgGuideStep{font-size:12px;color:var(--dsw-alias-label-tertiary, rgba(127,127,127,.9));margin-left:auto}
.sgGuideBody{font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary, currentColor);min-height:52px}
.sgGuideBody b{color:var(--dsw-alias-label-primary, currentColor);font-weight:600}
.sgGuideDots{display:flex;gap:6px;margin:10px 0 0}
.sgGuideDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-border-l2, rgba(127,127,127,.3))}
.sgGuideDot-on{background:var(--dsw-alias-button-primary-fill, #4d6bfe)}
.sgGuideFoot{display:flex;align-items:center;gap:8px;margin:12px 0 0}
.sgGuideBtn{appearance:none;font:inherit;font-size:12px;padding:5px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2, rgba(127,127,127,.3));background:transparent;color:var(--dsw-alias-label-primary, currentColor);cursor:pointer}
.sgGuideBtn-primary{background:var(--dsw-alias-button-primary-fill, #4d6bfe);border-color:transparent;color:#fff}
.sgGuideBtn-skip{margin-right:auto;color:var(--dsw-alias-label-tertiary, rgba(127,127,127,.9));border-color:transparent;text-decoration:underline}
.sgGuideRestart{appearance:none;font:inherit;font-size:12px;padding:0;border:0;background:transparent;color:var(--dsw-alias-link-primary, #4d6bfe);cursor:pointer;text-decoration:underline}
`

function injectGuideCss(): void {
  // 宿主是浏览器，但**测试替身**常常只给一个残缺的 document（无 querySelector /
  // 无 head）——样式注入是纯装饰，任何缺失都安静跳过，绝不让引导把卡面炸掉。
  try {
    if (typeof document === 'undefined') return
    if (typeof document.querySelector !== 'function') return
    if (typeof document.createElement !== 'function') return
    if (!document.head) return
    if (document.querySelector('style[data-plugin-css="guide-kit"]') !== null) return
    const tag = document.createElement('style')
    tag.dataset.pluginCss = 'guide-kit'
    tag.textContent = GUIDE_CSS
    document.head.appendChild(tag)
  } catch {
    /* 残缺 DOM：跳过样式，行为不受影响 */
  }
}

/** 语言变更订阅：语言切换后重渲染词表（引导是短生命周期，直接跟随 <html lang>）。 */
function useLangTick(): void {
  const [, setTick] = useState(0)
  useEffect(() => {
    try {
      if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
      if (!document.documentElement) return
      const observer = new MutationObserver(() => setTick((n) => n + 1))
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
      return () => observer.disconnect()
    } catch {
      return
    }
  }, [])
}

/**
 * 引导主体：3 步以内的小教学 + 恒定可见的 Skip。
 *
 * `onClose` 由宿主卡面传：Skip/Done 都会调用它（Skip 同时写标记）。
 */
export function GuidePanel(props: {
  ns: string
  steps: readonly GuideStep[]
  onClose: () => void
}): JSX.Element | null {
  const { ns, steps, onClose } = props
  const [index, setIndex] = useState(0)
  useLangTick()
  const labels = guideLabels()
  useEffect(() => {
    injectGuideCss()
  }, [])
  if (steps.length === 0) return null
  const current = steps[Math.min(index, steps.length - 1)]!
  const last = index >= steps.length - 1
  // Skip 与 Done 都写标记：**「看过」= 不再自动弹**。只给 Skip 写字会让点
  // 「开始使用」走完的用户每次进设置面都被再教一遍（认真看完的人最烦这个）。
  const finish = (): void => {
    skipGuide(ns)
    onClose()
  }
  return (
    <section className="sgGuide" aria-label={labels.title}>
      <header className="sgGuideHead">
        <span className="sgGuideTitle">{labels.title}</span>
        <span className="sgGuideStep">{labels.stepOf(index + 1, steps.length)}</span>
      </header>
      <div className="sgGuideBody">
        <b>{current.title}</b>
        <div>{current.body}</div>
      </div>
      <div className="sgGuideDots" aria-hidden="true">
        {steps.map((step, i) => (
          <span key={step.title} className={'sgGuideDot' + (i === index ? ' sgGuideDot-on' : '')} />
        ))}
      </div>
      <footer className="sgGuideFoot">
        <button type="button" className="sgGuideBtn sgGuideBtn-skip" onClick={() => finish()}>
          {labels.skip}
        </button>
        {index > 0 && (
          <button type="button" className="sgGuideBtn" onClick={() => setIndex(index - 1)}>
            {labels.prev}
          </button>
        )}
        {last ? (
          <button type="button" className="sgGuideBtn sgGuideBtn-primary" onClick={() => finish()}>
            {labels.done}
          </button>
        ) : (
          <button type="button" className="sgGuideBtn sgGuideBtn-primary" onClick={() => setIndex(index + 1)}>
            {labels.next}
          </button>
        )}
      </footer>
    </section>
  )
}

/**
 * 重启入口：清标记 + 就地重开引导。
 *
 * 统一件，避免九插件各写一份（措辞/样式/清标记时机容易走样）。跳过之后
 * 用户想再看一次，不需要去清浏览器存储。
 */
export function GuideRestartButton(props: {
  ns: string
  onOpen: () => void
  style?: CSSProperties
}): JSX.Element {
  const { ns, onOpen, style } = props
  useLangTick()
  return (
    <button
      type="button"
      className="sgGuideRestart"
      style={style}
      onClick={() => {
        resetGuide(ns)
        onOpen()
      }}
    >
      {guideLabels().restart}
    </button>
  )
}
