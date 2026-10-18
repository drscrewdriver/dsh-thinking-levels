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
/** 币种：目录原样，不折算。 */
export type Currency = 'CNY' | 'USD';
/** 三价目位（每百万 token）。 */
export interface PriceRow {
    inputMiss: number;
    inputCacheHit: number;
    output: number;
}
/** 每 API 计价策略档位（estimate = 目录外典型价兜底估算，未校准仅供参考）。 */
export type PricingPolicy = 'estimate' | 'cn' | 'global' | 'custom' | 'off';
/** 生效来源：四档 + 目录外兜底标记。 */
export type PricingSource = PricingPolicy | 'catalog-miss';
/** 峰/谷/平三态；平价条目（无峰谷官方价）与 custom 档用 flat。 */
export type Tier = 'peak' | 'offPeak' | 'flat';
/** 自填整行替换价（custom 档携带）。 */
export interface CustomPrices extends PriceRow {
    currency: Currency;
}
/** 一条 API 级策略。 */
export interface PolicyEntry {
    policy: PricingPolicy;
    custom?: CustomPrices;
}
/** 计价快照：投影按事件时刻现读（设置派生），policies/custom 为策略面前置位。 */
export interface PricingSnapshot {
    defaultPricing: PricingPolicy;
    policies?: Readonly<Record<string, PolicyEntry>>;
}
/** 目录条目：cn 为 峰谷对 或 平价行；global 预留平价（当前留空）。 */
export interface CatalogEntry {
    key: string;
    label: string;
    aliases: readonly string[];
    cn?: {
        peak: PriceRow;
        offPeak: PriceRow;
    } | {
        flat: PriceRow;
    };
    global?: {
        flat: PriceRow;
    };
    /** 复核日期（YYYY-MM-DD）。 */
    asOf: string;
    /** 来源标注（官方定价页或仓内镜像快照路径）。 */
    source: string;
}
/** 目录版本（进解析缓存键与审计）。 */
export declare const CATALOG_VERSION = 1;
/**
 * 目录外模型的兜底典型价（CNY/百万 token）：取 DeepSeek-V4.1-Flash 谷时行
 * ——主力模型的平价档，数量级最贴近通用网关。仅用于 estimate 档/目录外缺省，
 * 展示侧必须带「未校准·仅供参考」标注，不得伪装成目录条目。
 */
export declare const BILLING_FALLBACK: {
    row: PriceRow;
    currency: Currency;
};
/** 内置典型价目目录（CNY/百万 token）。 */
export declare const PRICE_CATALOG: readonly CatalogEntry[];
/**
 * 中国法定节假日修正表（北京时间 YYYY-MM-DD → isOffDay），2026 年国务院安排
 * （holiday-cn 定稿 39 条 = 33 放假日 + 6 调休补班日，与 dsh-session-guard
 * BUILTIN_2026 同源同构）：true = 放假日（含落工作日的法定假）；false = 调休
 * 补班日（落周末但按工作日计价）。表外日期回退自然周末；表外年份退化为只认周末。
 */
export declare const HOLIDAY_TABLE_2026: ReadonlyMap<string, boolean>;
/** 按年索引的修正表（新定稿年份在此追加；2027 待国务院公告后补录）。 */
export declare const HOLIDAY_TABLES: ReadonlyMap<number, ReadonlyMap<string, boolean>>;
/** 北京日期是否为工作日：表内条目定乾坤（放假=非工作，补班=工作），表外回退自然周末。 */
export declare function isWorkdayBeijing(shifted: Date, ymd: string): boolean;
/** 时刻是否为北京高峰。UTC+8 纯数学换算；无效时间戳用 getUTC* 拼串不抛错。 */
export declare function isPeakBeijing(timeMs: number): boolean;
/** 目录匹配：全表精确 > 最长后缀 > 最长包含（沿用 rateOf 三级语义，扩到全目录）。 */
export declare function findEntry(model: string | null): CatalogEntry | null;
/** 解析结果：null 行 = 不计价（priced=false 恒随 row==null）。 */
export interface ResolvedRate {
    row: PriceRow | null;
    tier: Tier | null;
    currency: Currency | null;
    /** 生效来源；目录外兜底记 'catalog-miss'。 */
    source: PricingSource;
    entry: CatalogEntry | null;
    priced: boolean;
    /** 金额为兜底典型价估算（未校准，仅供参考）；恒随 priced。 */
    estimated: boolean;
}
/** 唯一计价解析出口。目录命中且无显式策略时取条目自身地区（cn 优先，仅 global 取 global）。 */
export declare function resolveRate(model: string | null, provider: string | null, timeMs: number, snapshot: PricingSnapshot): ResolvedRate;
