/**
 * dsh-thinking-levels 的首次使用引导文案（3 步）。
 *
 * 与 `guide.tsx`（生成副本）分文件：副本会被 `_tools/guide-kit/sync.mjs` 覆盖。
 */
import type { GuideLocale, GuideStep } from './guide.tsx'

export const THINKING_GUIDE_STEPS: Partial<Record<GuideLocale, readonly GuideStep[]>> = {
  zh: [
    {
      title: '它决定「想多深」',
      body: '按请求难度自动挑思考档位：简单问答降到 low，复杂任务抬到 high。默认「自动」就够用，别一上来钉死 max——贵且慢。',
    },
    {
      title: '允许上浮比允许下调更重要',
      body: '「允许上调」打开后遇到难题会自动加深思考；「允许降级」则会为了省钱往下压。想稳就先只开上调。',
    },
    {
      title: '看实时档位在环上',
      body: '输入框右侧的圆环显示当前上下文占用与压力档；点开模型面板能看到本次请求实际发出的思考档位与理由。',
    },
  ],
  en: [
    {
      title: 'It decides how deeply to think',
      body: 'Picks a reasoning effort per request by difficulty: easy Q&A drops to low, hard tasks rise to high. "Auto" is enough — don\'t pin max from the start, it is slow and expensive.',
    },
    {
      title: 'Allowing upgrades matters more than allowing downgrades',
      body: 'With "allow upgrade" on, hard problems get more thinking automatically; "allow downgrade" pushes thinking down to save money. For stability, turn on upgrade only.',
    },
    {
      title: 'The ring shows the live gear',
      body: 'The ring right of the composer shows context usage and pressure; open the model panel to see the effort actually sent with this request and why.',
    },
  ],
}
