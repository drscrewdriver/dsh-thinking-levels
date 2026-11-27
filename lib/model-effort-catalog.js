/** The seven host levels, in slider order — the catalog's key domain. */
export const WIRE_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const RETRIEVED = '2026-11-27';
export const EFFORT_TIER_FAMILIES = [
    {
        id: 'openai-gpt5',
        label: 'OpenAI GPT-5.x',
        providerMatch: [/^openai$/i, /chatgpt/i],
        modelMatch: [/^gpt-5/i],
        wires: { off: 'none', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
        vendorDefault: 'medium',
        canDisable: true,
        toggleOnly: false,
        // findings §1.7: only gpt-5.5 confirmed first-hand; whether other GPT-5.x
        // models carry `minimal`/`max` is unverified -> low, display-only.
        confidence: 'low',
        source: { url: 'https://modelparams.dev/models/openai/gpt-5.5', retrievedAt: RETRIEVED },
        notes: 'gpt-5.5: none|low|medium|high|xhigh, default medium. Other GPT-5.x sets unverified.',
    },
    {
        id: 'anthropic-claude',
        label: 'Claude',
        providerMatch: [/^anthropic$/i, /claude/i],
        modelMatch: [/^claude-/i],
        // Base shape = the 4.6 line (no xhigh). Variants widen per model docs.
        wires: { low: 'low', medium: 'medium', high: 'high', max: 'max' },
        vendorDefault: 'high',
        canDisable: false,
        toggleOnly: false,
        confidence: 'high',
        variants: [
            // Fable 5.2 — five levels, default medium.
            { modelMatch: [/fable/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'medium' },
            // 5.5 / 5 line and Opus 4.7/4.8 — five levels; 5.5 line defaults medium, 4.7 xhigh.
            { modelMatch: [/-(?:opus|sonnet|haiku)-5(?:\.5)?$/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'medium' },
            { modelMatch: [/^claude-opus-4\.7$/i], wires: { xhigh: 'xhigh' }, vendorDefault: 'xhigh' },
            { modelMatch: [/^claude-opus-4\.8$/i], wires: { xhigh: 'xhigh' } },
        ],
        source: { url: 'https://code.claude.com/docs/en/model-config', retrievedAt: RETRIEVED },
        notes: 'Unsupported level falls back DOWNWARD to the highest supported one (vendor semantics).',
    },
    {
        id: 'gemini-4',
        label: 'Gemini 4',
        providerMatch: [/google/i, /gemini/i],
        modelMatch: [/^gemini-4/i],
        wires: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
        vendorDefault: 'high',
        canDisable: false,
        toggleOnly: false,
        confidence: 'high',
        source: { url: 'https://raw.githubusercontent.com/google-gemini/cookbook/main/quickstarts/Get_started_thinking.ipynb', retrievedAt: RETRIEVED },
        notes: 'Thinking is always on for Gemini 4; no `minimal` level. Pro/Hydrogen default high, Carbon/Argon default medium.',
    },
    {
        id: 'gemini-3',
        label: 'Gemini 3',
        providerMatch: [/google/i, /gemini/i],
        modelMatch: [/^gemini-3/i],
        // findings §1.4: minimal only on 3.5/3.6 flash; Pro defaults high, flash line medium.
        wires: { low: 'low', medium: 'medium', high: 'high' },
        vendorDefault: 'medium',
        canDisable: false,
        toggleOnly: false,
        confidence: 'high',
        variants: [
            { modelMatch: [/^gemini-3\.[56].*flash/i], wires: { minimal: 'minimal' } },
            { modelMatch: [/pro/i], vendorDefault: 'high' },
        ],
        source: { url: 'https://raw.githubusercontent.com/google-gemini/cookbook/main/quickstarts/Get_started_thinking.ipynb', retrievedAt: RETRIEVED },
    },
    {
        id: 'deepseek-v4',
        label: 'DeepSeek V4',
        providerMatch: [/deepseek/i],
        modelMatch: [/^deepseek/i],
        // Official mapping table (findings §1.1): minimal->low, medium->high,
        // xhigh->high; max stays max; none disables on the Responses API only.
        wires: { off: 'none', minimal: 'low', low: 'low', medium: 'high', high: 'high', xhigh: 'high', max: 'max' },
        vendorDefault: 'high',
        canDisable: true,
        toggleOnly: false,
        confidence: 'high',
        source: { url: 'https://api-docs.deepseek.com/guides/thinking_mode/', retrievedAt: RETRIEVED },
        notes: 'Thinking on by default, default high. `none` exists on the Responses API only; OpenAI/Anthropic formats take low/high/max.',
    },
    {
        id: 'grok-4.6',
        label: 'Grok 4.6+',
        providerMatch: [/xai/i, /grok/i],
        modelMatch: [/^grok-4\.[6-9]/i, /^grok-[5-9]/i],
        wires: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
        vendorDefault: 'high',
        canDisable: false,
        toggleOnly: false,
        confidence: 'high',
        source: { url: 'https://modelparams.dev/models/xai/grok-4.6', retrievedAt: RETRIEVED },
        notes: 'Reasoning cannot be disabled; xhigh from grok-4.6 onward.',
    },
    {
        id: 'qwen-effort',
        label: 'Qwen (effort)',
        providerMatch: [/qwen/i, /dashscope/i, /tongyi/i],
        modelMatch: [/^qwen3\.[5-9].*(?:max|omni-flash)/i],
        wires: { low: 'low', medium: 'medium', xhigh: 'xhigh' },
        vendorDefault: 'xhigh',
        canDisable: false,
        toggleOnly: false,
        confidence: 'high',
        source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
        notes: 'qwen3.8-max: low|medium|xhigh, default xhigh. reasoning_effort and thinking_budget must not be set together.',
    },
    {
        id: 'qwen-toggle',
        label: 'Qwen (toggle)',
        providerMatch: [/qwen/i, /dashscope/i, /tongyi/i],
        modelMatch: [/^qwen/i],
        wires: {},
        vendorDefault: 'on',
        canDisable: true,
        toggleOnly: true,
        confidence: 'high',
        source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
        notes: 'Hybrid thinking via per-request enable_thinking; no confirmed effort gradient. qwen-plus/qwen-flash default thinking OFF.',
    },
    {
        id: 'glm-kimi-minimax-toggle',
        label: 'GLM / Kimi / MiniMax (toggle)',
        providerMatch: [/zhipu|glm|moonshot|kimi|minimax/i],
        modelMatch: [/^(?:glm|kimi|MiniMax)/i, /^(?:glm|kimi|minimax)/i],
        wires: {},
        vendorDefault: 'on',
        canDisable: true,
        toggleOnly: true,
        confidence: 'low',
        source: { url: 'https://docs.qwencloud.com/developer-guides/text-generation/thinking', retrievedAt: RETRIEVED },
        notes: 'Docs confirm enable/disable only (thinking-only lines like glm-5.3, kimi-k2.7-code cannot disable); no effort gradient verified -> display-only.',
    },
];
function matchesAll(matchers, value) {
    return matchers.length === 0 || matchers.some(pattern => pattern.test(value));
}
/** The first family whose provider AND model patterns match, or undefined (never guess). */
export function matchEffortFamily(provider, model) {
    return EFFORT_TIER_FAMILIES.find(family => matchesAll(family.providerMatch, provider) && matchesAll(family.modelMatch, model));
}
/** Family data with the first matching variant merged over it. */
export function resolveTier(provider, model) {
    const family = matchEffortFamily(provider, model);
    if (family === undefined)
        return undefined;
    const variant = family.variants?.find(candidate => matchesAll(candidate.modelMatch, model));
    return {
        family,
        wires: variant?.wires === undefined ? family.wires : { ...family.wires, ...variant.wires },
        vendorDefault: variant?.vendorDefault ?? family.vendorDefault,
        canDisable: family.canDisable,
        toggleOnly: family.toggleOnly,
        confidence: family.confidence,
    };
}
/**
 * The `reasoningEfforts` shape the llm-pi-ai user layer takes:
 * `Partial<Record<WireLevel, string | null>>` — wire spelling per supported
 * level, `off: null` when the family can disable thinking (null = the host's
 * "no wire value, strip the param" convention), absent for unsupported levels.
 * Toggle-only families produce an empty map (there is nothing to write).
 */
export function reasoningEffortsOf(tier) {
    if (tier.toggleOnly)
        return {};
    const out = {};
    for (const level of WIRE_LEVELS) {
        const wire = tier.wires[level];
        if (wire !== undefined)
            out[level] = wire;
        else if (level === 'off' && tier.canDisable)
            out.off = null;
    }
    return out;
}
