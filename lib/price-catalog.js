/**
 * TL price catalog (`tlPriceCatalog`) — the single source of pricing truth.
 *
 * 目录化改造 T1：把 billing-projection 硬编码的 Flash 单表升级为「模型 × 地区」
 * 典型价目目录。三价目位统一口径 inputMiss（非缓存输入）/ inputCacheHit（缓存
 * 命中输入）/ output，单位 每百万 token；币种按目录原样（cn=CNY、global=USD），
 * 不做汇率折算。
 *
 * 数据来源（真实取值口径）：
 * - deepseek-v4.1-flash 行：迁移自 4.2.1 BILLING_MODEL（官方定价页，原复核日期
 *   未记载，随本次目录化补记 2026-10-17）；
 * - deepseek-v4-* 峰谷行：镜像 .peakref companion price/service.js BUILTIN_SHEET
 *   （官方定价页 2026-08-14 快照，2026-08-17 起峰谷分时；峰窗 09-12/14-18 北京）；
 * - 国内厂商 flat 行：镜像 .peakref companion price/catalog.js CATALOG_TABLE
 *   （各官方定价页人民币站低档价快照；免费行照录 0）；
 * - 海外 USD 行：本轮网络侧无法核实（OpenAI 403 / Google 超时 / Anthropic 页无
 *   API 表），结构留位、数值留空——宁缺毋伪，核实通道到位后走 golden 门禁补录。
 *
 * 判定链：策略 key 特异性（provider/model > model > provider > *）→ 目录命中
 * （精确 > 最长后缀 > 最长包含）→ 目录外走 snapshot.defaultPricing（缺省
 * estimate = 典型价兜底估算，source 记 'catalog-miss' 且 estimated=true；
 * off 才是真不计价）。节假日/补班修正表随 isPeakBeijing 一并迁入，
 * billing-projection 只负责记账，不再持有价格与日历。
 * @module dsh-thinking-levels/price-catalog
 */
/** 目录版本（进解析缓存键与审计）。 */
export const CATALOG_VERSION = 1;
/**
 * 目录外模型的兜底典型价（CNY/百万 token）：取 DeepSeek-V4.1-Flash 谷时行
 * ——主力模型的平价档，数量级最贴近通用网关。仅用于 estimate 档/目录外缺省，
 * 展示侧必须带「未校准·仅供参考」标注，不得伪装成目录条目。
 */
export const BILLING_FALLBACK = {
    row: { inputCacheHit: 0.02, inputMiss: 1, output: 4 },
    currency: 'CNY',
};
const PEAKOFF = 'DeepSeek 官方峰谷分时（峰窗 09-12/14-18 北京；源 api-docs.deepseek.com/zh-cn/quick_start/pricing/）';
const PEAKREF = '镜像 .peakref/companion/lib/core/price/catalog.js 官方页快照（低档价）';
/** 内置典型价目目录（CNY/百万 token）。 */
export const PRICE_CATALOG = [
    {
        key: 'deepseek-v4.1-flash',
        label: 'DeepSeek-V4.1-Flash',
        aliases: ['deepseek-v4.1-flash', 'deepseek-flash'],
        cn: { peak: { inputCacheHit: 0.04, inputMiss: 2, output: 8 }, offPeak: { inputCacheHit: 0.02, inputMiss: 1, output: 4 } },
        asOf: '2026-10-17',
        source: `迁移自 4.2.1 BILLING_MODEL；${PEAKOFF}`,
    },
    {
        key: 'deepseek-v4-flash',
        label: 'DeepSeek-V4-Flash',
        aliases: ['deepseek-v4-flash', 'deepseek-v4-flash-vision-exp'],
        cn: { peak: { inputCacheHit: 0.1, inputMiss: 3, output: 9 }, offPeak: { inputCacheHit: 0.05, inputMiss: 1.5, output: 4.5 } },
        asOf: '2026-08-14',
        source: PEAKOFF,
    },
    {
        key: 'deepseek-v4-pro',
        label: 'DeepSeek-V4-Pro',
        aliases: ['deepseek-v4-pro'],
        cn: { peak: { inputCacheHit: 0.3, inputMiss: 9, output: 27 }, offPeak: { inputCacheHit: 0.15, inputMiss: 4.5, output: 13.5 } },
        asOf: '2026-08-14',
        source: PEAKOFF,
    },
    {
        key: 'deepseek-chat',
        label: 'DeepSeek-Chat',
        aliases: ['deepseek-chat'],
        cn: { flat: { inputCacheHit: 0.5, inputMiss: 2, output: 8 } },
        asOf: '2026-10-17',
        source: '镜像 peakref BUILTIN_SHEET.current（插件原静态表）',
    },
    {
        key: 'deepseek-coder',
        label: 'DeepSeek-Coder',
        aliases: ['deepseek-coder'],
        // 官方未公布 coder 缓存价：命中按普通输入价。
        cn: { flat: { inputCacheHit: 4, inputMiss: 4, output: 12 } },
        asOf: '2026-10-17',
        source: '镜像 peakref BUILTIN_SHEET.current（缓存价未公布，命中=输入价）',
    },
    // ---- 智谱 GLM（bigmodel 低价档） ----
    { key: 'glm-5.2', label: 'GLM-5.2', aliases: ['glm-5.2'], cn: { flat: { inputCacheHit: 2, inputMiss: 8, output: 28 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'glm-5.1', label: 'GLM-5.1', aliases: ['glm-5.1'], cn: { flat: { inputCacheHit: 1.3, inputMiss: 6, output: 24 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'glm-5', label: 'GLM-5', aliases: ['glm-5'], cn: { flat: { inputCacheHit: 0.8, inputMiss: 4, output: 18 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'glm-4.7', label: 'GLM-4.7', aliases: ['glm-4.7'], cn: { flat: { inputCacheHit: 0.4, inputMiss: 2, output: 8 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'glm-4.6', label: 'GLM-4.6', aliases: ['glm-4.6'], cn: { flat: { inputCacheHit: 1, inputMiss: 5, output: 5 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'glm-4.5-air', label: 'GLM-4.5-Air', aliases: ['glm-4.5-air'], cn: { flat: { inputCacheHit: 0.16, inputMiss: 0.8, output: 2 } }, asOf: '2026-10-17', source: PEAKREF },
    // ---- 月之暗面 Kimi（人民币站） ----
    { key: 'kimi-k2.7-code-highspeed', label: 'Kimi-K2.7-Code-HighSpeed', aliases: ['kimi-k2.7-code-highspeed'], cn: { flat: { inputCacheHit: 2.6, inputMiss: 13, output: 54 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'kimi-k2.7-code', label: 'Kimi-K2.7-Code', aliases: ['kimi-k2.7-code'], cn: { flat: { inputCacheHit: 1.3, inputMiss: 6.5, output: 27 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'kimi-k2.6', label: 'Kimi-K2.6', aliases: ['kimi-k2.6'], cn: { flat: { inputCacheHit: 1.1, inputMiss: 6.5, output: 27 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'kimi-k2.5', label: 'Kimi-K2.5', aliases: ['kimi-k2.5'], cn: { flat: { inputCacheHit: 0.7, inputMiss: 4, output: 21 } }, asOf: '2026-10-17', source: PEAKREF },
    // ---- 阿里通义千问（百炼中国内地低档） ----
    { key: 'qwen3-max', label: 'Qwen3-Max', aliases: ['qwen3-max'], cn: { flat: { inputCacheHit: 0.5, inputMiss: 2.5, output: 10 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'qwen3-coder-plus', label: 'Qwen3-Coder-Plus', aliases: ['qwen3-coder-plus'], cn: { flat: { inputCacheHit: 0.2, inputMiss: 1, output: 4 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'qwen3-plus', label: 'Qwen3-Plus', aliases: ['qwen3-plus', 'qwen-plus'], cn: { flat: { inputCacheHit: 0.16, inputMiss: 0.8, output: 2 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'qwen3-flash', label: 'Qwen3-Flash', aliases: ['qwen3-flash', 'qwen-flash'], cn: { flat: { inputCacheHit: 0.03, inputMiss: 0.15, output: 1.5 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'qwen-turbo', label: 'Qwen-Turbo', aliases: ['qwen-turbo'], cn: { flat: { inputCacheHit: 0.06, inputMiss: 0.3, output: 0.6 } }, asOf: '2026-10-17', source: PEAKREF },
    // ---- 字节豆包（火山方舟输入 0-32K 档） ----
    { key: 'doubao-seed-2.1-pro', label: 'Doubao-Seed-2.1-Pro', aliases: ['doubao-seed-2.1-pro'], cn: { flat: { inputCacheHit: 1.2, inputMiss: 6, output: 30 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'doubao-seed-2.1-turbo', label: 'Doubao-Seed-2.1-Turbo', aliases: ['doubao-seed-2.1-turbo'], cn: { flat: { inputCacheHit: 0.6, inputMiss: 3, output: 15 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'doubao-seed-2.0-mini', label: 'Doubao-Seed-2.0-Mini', aliases: ['doubao-seed-2.0-mini'], cn: { flat: { inputCacheHit: 0.04, inputMiss: 0.2, output: 2 } }, asOf: '2026-10-17', source: PEAKREF },
    // ---- MiniMax（按量计费） ----
    { key: 'minimax-m2.7-highspeed', label: 'MiniMax-M2.7-HighSpeed', aliases: ['minimax-m2.7-highspeed'], cn: { flat: { inputCacheHit: 0.42, inputMiss: 4.2, output: 16.8 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'minimax-m3', label: 'MiniMax-M3', aliases: ['minimax-m3'], cn: { flat: { inputCacheHit: 0.42, inputMiss: 2.1, output: 8.4 } }, asOf: '2026-10-17', source: `${PEAKREF}（≤512K 永久五折后）` },
    { key: 'minimax-m2.7', label: 'MiniMax-M2.7', aliases: ['minimax-m2.7'], cn: { flat: { inputCacheHit: 0.42, inputMiss: 2.1, output: 8.4 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'minimax-m2.5', label: 'MiniMax-M2.5', aliases: ['minimax-m2.5'], cn: { flat: { inputCacheHit: 0.21, inputMiss: 2.1, output: 8.4 } }, asOf: '2026-10-17', source: PEAKREF },
    // ---- 百度文心（千帆） ----
    { key: 'ernie-4.5', label: 'Ernie-4.5', aliases: ['ernie-4.5'], cn: { flat: { inputCacheHit: 0.8, inputMiss: 4, output: 16 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'ernie-4.5-turbo', label: 'Ernie-4.5-Turbo', aliases: ['ernie-4.5-turbo'], cn: { flat: { inputCacheHit: 0.16, inputMiss: 0.8, output: 3.2 } }, asOf: '2026-10-17', source: PEAKREF },
    { key: 'ernie-x1', label: 'Ernie-X1', aliases: ['ernie-x1'], cn: { flat: { inputCacheHit: 0.4, inputMiss: 2, output: 8 } }, asOf: '2026-10-17', source: PEAKREF },
];
/**
 * 中国法定节假日修正表（北京时间 YYYY-MM-DD → isOffDay），2026 年国务院安排
 * （holiday-cn 定稿 39 条 = 33 放假日 + 6 调休补班日，与 dsh-session-guard
 * BUILTIN_2026 同源同构）：true = 放假日（含落工作日的法定假）；false = 调休
 * 补班日（落周末但按工作日计价）。表外日期回退自然周末；表外年份退化为只认周末。
 */
export const HOLIDAY_TABLE_2026 = new Map([
    // 元旦
    ['2026-01-01', true], ['2026-01-02', true], ['2026-01-03', true], ['2026-01-04', false],
    // 春节
    ['2026-02-14', false],
    ['2026-02-15', true], ['2026-02-16', true], ['2026-02-17', true], ['2026-02-18', true],
    ['2026-02-19', true], ['2026-02-20', true], ['2026-02-21', true], ['2026-02-22', true],
    ['2026-02-23', true], ['2026-02-28', false],
    // 清明
    ['2026-04-04', true], ['2026-04-05', true], ['2026-04-06', true],
    // 劳动节
    ['2026-05-01', true], ['2026-05-02', true], ['2026-05-03', true], ['2026-05-04', true],
    ['2026-05-05', true], ['2026-05-09', false],
    // 端午
    ['2026-06-19', true], ['2026-06-20', true], ['2026-06-21', true],
    // 中秋
    ['2026-09-20', false], ['2026-09-25', true], ['2026-09-26', true], ['2026-09-27', true],
    // 国庆
    ['2026-10-01', true], ['2026-10-02', true], ['2026-10-03', true], ['2026-10-04', true],
    ['2026-10-05', true], ['2026-10-06', true], ['2026-10-07', true], ['2026-10-10', false],
]);
/** 按年索引的修正表（新定稿年份在此追加；2027 待国务院公告后补录）。 */
export const HOLIDAY_TABLES = new Map([
    [2026, HOLIDAY_TABLE_2026],
]);
/** 北京日期是否为工作日：表内条目定乾坤（放假=非工作，补班=工作），表外回退自然周末。 */
export function isWorkdayBeijing(shifted, ymd) {
    const correction = HOLIDAY_TABLES.get(shifted.getUTCFullYear())?.get(ymd);
    if (correction !== undefined)
        return !correction;
    const day = shifted.getUTCDay();
    return day !== 0 && day !== 6;
}
/** 时刻是否为北京高峰。UTC+8 纯数学换算；无效时间戳用 getUTC* 拼串不抛错。 */
export function isPeakBeijing(timeMs) {
    const shifted = new Date(timeMs + 8 * 3600 * 1000);
    const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(shifted.getUTCDate()).padStart(2, '0');
    const ymd = `${shifted.getUTCFullYear()}-${month}-${dayOfMonth}`;
    if (!isWorkdayBeijing(shifted, ymd))
        return false;
    const hour = shifted.getUTCHours();
    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
}
const lower = (s) => (s ?? '').trim().toLowerCase();
/** 目录匹配：全表精确 > 最长后缀 > 最长包含（沿用 rateOf 三级语义，扩到全目录）。 */
export function findEntry(model) {
    const key = lower(model);
    if (key === '')
        return null;
    let suffix = null;
    let suffixLen = 0;
    let contains = null;
    let containsLen = 0;
    for (const entry of PRICE_CATALOG) {
        for (const alias of entry.aliases) {
            if (key === alias)
                return entry;
            if (key.endsWith(alias) && alias.length > suffixLen) {
                suffix = entry;
                suffixLen = alias.length;
            }
            if (key.includes(alias) && alias.length > containsLen) {
                contains = entry;
                containsLen = alias.length;
            }
        }
    }
    return suffix ?? contains;
}
/** 条目是否有峰谷对。 */
const hasPeak = (cn) => 'peak' in cn;
/** 从目录条目按地区取行。 */
function regionRow(entry, region, timeMs) {
    if (region === 'cn') {
        const cn = entry.cn;
        if (cn === undefined)
            return null;
        if (hasPeak(cn)) {
            const peak = isPeakBeijing(timeMs);
            return { row: peak ? cn.peak : cn.offPeak, tier: peak ? 'peak' : 'offPeak', currency: 'CNY' };
        }
        return { row: cn.flat, tier: 'flat', currency: 'CNY' };
    }
    const g = entry.global;
    if (g === undefined)
        return null;
    return { row: g.flat, tier: 'flat', currency: 'USD' };
}
/** 策略 key 匹配：provider/model > model > provider > *。 */
function policyFor(provider, model, policies) {
    if (policies === undefined)
        return undefined;
    const p = lower(provider);
    const m = lower(model);
    return (p !== '' && m !== '' ? policies[`${p}/${m}`] : undefined)
        ?? (m !== '' ? policies[m] : undefined)
        ?? (p !== '' ? policies[p] : undefined)
        ?? policies['*'];
}
/** 唯一计价解析出口。目录命中且无显式策略时取条目自身地区（cn 优先，仅 global 取 global）。 */
export function resolveRate(model, provider, timeMs, snapshot) {
    const entry = findEntry(model);
    const explicit = policyFor(provider, model, snapshot.policies);
    const viaDefault = entry === null && explicit === undefined;
    const policy = explicit?.policy
        ?? (entry !== undefined && entry !== null
            ? (entry.cn !== undefined ? 'cn' : 'global')
            : snapshot.defaultPricing);
    const miss = (row) => viaDefault ? { ...row, source: 'catalog-miss' } : row;
    if (policy === 'off')
        return miss({ row: null, tier: null, currency: null, source: 'off', entry, priced: false, estimated: false });
    if (policy === 'custom') {
        const custom = explicit?.custom;
        if (custom === undefined)
            return miss({ row: null, tier: null, currency: null, source: 'custom', entry, priced: false, estimated: false });
        return miss({ row: { inputMiss: custom.inputMiss, inputCacheHit: custom.inputCacheHit, output: custom.output }, tier: 'flat', currency: custom.currency, source: 'custom', entry, priced: true, estimated: false });
    }
    // 目录外 + 非 off/custom 档（缺省 estimate，或显式选 cn/global 校准档），
    // 或显式 estimate 命中目录内（取不到地区行）：取典型价兜底估算并标
    // estimated——展示侧带「未校准·仅供参考」，不再显示「未计价」。
    // 命中条目但地区无行（如 global 留空期）不回退兜底。
    if (entry === null || policy === 'estimate') {
        return miss({ row: { ...BILLING_FALLBACK.row }, tier: 'flat', currency: BILLING_FALLBACK.currency, source: policy, entry, priced: true, estimated: true });
    }
    const picked = regionRow(entry, policy, timeMs);
    if (picked === null)
        return miss({ row: null, tier: null, currency: null, source: policy, entry, priced: false, estimated: false });
    return miss({ ...picked, source: policy, entry, priced: true, estimated: false });
}
