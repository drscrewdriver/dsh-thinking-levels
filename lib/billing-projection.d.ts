/**
 * TL cache-billing projection unit (`tlCacheBilling`).
 *
 * Accounting semantics ported from better-er/dsh-cache-billing (read line by
 * line, see .agents/plans/tl-billing-popover): usage samples from
 * assistant/chunk (type 'usage') and assistant/message (data.usage), same-step
 * replacement settles old-minus-new, turn aggregation resets on turn switch,
 * session totals price every sample at its own event-time rate.
 *
 * 目录化改造 T3：价格与日历判定全部下沉 `price-catalog.ts`（唯一事实源），本单
 * 元只做记账。计价在**折入时刻**结算并作为凭证（`Sample.billed`）持久进 state：
 * - 同 step 替换「减记录值、加新算值」——杜绝按新费率重算旧账的混口径负数路径；
 * - 金额按币种分桶（CNY/USD），跨币种会话不再相加失真；
 * - `view` 只读凭证不重算，设置改价不会漂移已展示的读数；
 * - 目录外模型的兜底典型价估算带 `estimated` 凭证位（未校准仅供参考）。
 * 语义边界：改价只影响在线增量新账；冷重放（checkpoint 废弃后整段重折）必然
 * 按当前目录重算——stateVersion 3 即为此声明（宿主对旧 ver 行整行废弃重折，
 * ver 2 凭证缺 estimated 字段，不可原样过新 schema）。
 *
 * 计价快照经 `buildBillingDefinition(getPricing)` 闭包注入，按事件时刻现读；
 * **热路径绝不走 describeSettings**（宿主 describe 非轻量且会 emit 事件）。
 *
 * Schema library: the projection framework duck-types `stateSchema.parse()` /
 * `wire.viewSchema.parse()` (dsh-session-projection lib:255/259/305), so these
 * MUST be real zod objects — schemastery has no parse. zod ^4.4.3 rides in
 * dependencies (TL's tsc build does not bundle).
 * @module dsh-thinking-levels/billing-projection
 */
import { z } from 'zod';
import { type Currency, type PriceRow, type PricingSnapshot, type PricingSource, type Tier } from './price-catalog.ts';
export { isPeakBeijing, HOLIDAY_TABLE_2026, HOLIDAY_TABLES } from './price-catalog.ts';
export { PRICE_CATALOG, CATALOG_VERSION } from './price-catalog.ts';
export type { Currency, PriceRow, Tier, PricingSnapshot, PricingPolicy, PricingSource, CatalogEntry, ResolvedRate } from './price-catalog.ts';
/** 一笔样本的计价凭证（折入时刻结算，plain JSON 持久）。 */
export interface Billed {
    hit: number;
    miss: number;
    output: number;
    currency: Currency;
    tier: Tier | null;
    source: PricingSource;
    priced: boolean;
    /** priced 且金额为兜底典型价估算（未校准，仅供参考）。 */
    estimated: boolean;
    catalogKey: string | null;
    catalogLabel: string | null;
    priceRow: PriceRow | null;
}
/** 目录外模型的兜底档位（设置面 defaultPricing 的值域）。 */
declare const POLICY_VALUES: readonly ["estimate", "cn", "global", "custom", "off"];
/** 一个 usage 样本：state.last 只存最新一轮。 */
export interface Sample {
    turn: number;
    step: number;
    inputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
    model: string | null;
    provider: string | null;
    /** 事件时刻 epoch ms（峰谷判定用事件时刻，不用当前时钟）。 */
    time: number;
    /** 折入时刻的计价凭证。 */
    billed: Billed;
}
/** 币种无关的使用计数（轮数/失效步数/tokens）。 */
export interface Counters {
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
    rounds: number;
    missSteps: number;
    writeTokens: number;
    fullMissSteps: number;
}
/** 单币种金额桶。 */
export interface Money {
    hitCost: number;
    missCost: number;
    outputCost: number;
}
/** 会话累计：金额按币种分桶；跨笔各按其事件时刻费率（折入时刻结算）。 */
export interface Totals {
    counts: Counters;
    money: Record<Currency, Money>;
}
/** 当前轮累计：turn 切换重置。 */
export interface TurnTotals {
    id: number;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
    money: Record<Currency, Money>;
}
export interface ProjectionState {
    provider: string | null;
    model: string | null;
    last: Sample | null;
    turn: TurnTotals | null;
    totals: Totals;
}
/** 写失效：发生过缓存写入（官方不报，恒 false，个别中转有值）。 */
export declare const isWriteMiss: (s: Sample) => boolean;
/** 完全失效：有输入但缓存命中为 0（首轮无缓存可命中也算，近似，任何路由可靠）。 */
export declare const isFullMiss: (s: Sample) => boolean;
/** 折入时刻结算：按解析出的费率行算三笔（off → 恒 0 且 priced=false）。 */
export declare function billFor(sample: Sample, snapshot: PricingSnapshot): Billed;
/**
 * Build the `tlCacheBilling` projection definition. Registered soft-coupled
 * (runtime inject — NEVER a top-level export inject, which would make the
 * whole plugin 0.2.0-only): hosts without the sessionProjections service
 * simply never register it, and the ring's billing section stays hidden.
 * @param getPricing - 折入时刻的计价快照读取（O(1)，由插件 config 派生）。
 */
export declare function buildBillingDefinition(getPricing: () => PricingSnapshot): {
    key: string;
    stateVersion: number;
    stateSchema: z.ZodObject<{
        provider: z.ZodNullable<z.ZodString>;
        model: z.ZodNullable<z.ZodString>;
        last: z.ZodNullable<z.ZodObject<{
            billed: z.ZodObject<{
                hit: z.ZodNumber;
                miss: z.ZodNumber;
                output: z.ZodNumber;
                currency: z.ZodEnum<{
                    CNY: "CNY";
                    USD: "USD";
                }>;
                tier: z.ZodNullable<z.ZodEnum<{
                    peak: "peak";
                    offPeak: "offPeak";
                    flat: "flat";
                }>>;
                source: z.ZodEnum<{
                    estimate: "estimate";
                    cn: "cn";
                    global: "global";
                    custom: "custom";
                    off: "off";
                    "catalog-miss": "catalog-miss";
                }>;
                priced: z.ZodBoolean;
                estimated: z.ZodBoolean;
                catalogKey: z.ZodNullable<z.ZodString>;
                catalogLabel: z.ZodNullable<z.ZodString>;
                priceRow: z.ZodNullable<z.ZodObject<{
                    inputMiss: z.ZodNumber;
                    inputCacheHit: z.ZodNumber;
                    output: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>;
            inputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNumber;
            cacheWriteTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            model: z.ZodNullable<z.ZodString>;
            provider: z.ZodNullable<z.ZodString>;
            time: z.ZodNumber;
            turn: z.ZodNumber;
            step: z.ZodNumber;
        }, z.core.$strip>>;
        turn: z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            inputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            money: z.ZodObject<{
                CNY: z.ZodObject<{
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                }, z.core.$strip>;
                USD: z.ZodObject<{
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        totals: z.ZodObject<{
            counts: z.ZodObject<{
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
            money: z.ZodObject<{
                CNY: z.ZodObject<{
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                }, z.core.$strip>;
                USD: z.ZodObject<{
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    init: () => {
        provider: string | null;
        model: string | null;
        last: {
            billed: {
                hit: number;
                miss: number;
                output: number;
                currency: "CNY" | "USD";
                tier: "peak" | "offPeak" | "flat" | null;
                source: "estimate" | "cn" | "global" | "custom" | "off" | "catalog-miss";
                priced: boolean;
                estimated: boolean;
                catalogKey: string | null;
                catalogLabel: string | null;
                priceRow: {
                    inputMiss: number;
                    inputCacheHit: number;
                    output: number;
                } | null;
            };
            inputTokens: number;
            cacheReadTokens: number;
            cacheWriteTokens: number;
            outputTokens: number;
            model: string | null;
            provider: string | null;
            time: number;
            turn: number;
            step: number;
        } | null;
        turn: {
            id: number;
            inputTokens: number;
            cacheReadTokens: number;
            outputTokens: number;
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        } | null;
        totals: {
            counts: {
                inputTokens: number;
                cacheReadTokens: number;
                outputTokens: number;
                rounds: number;
                missSteps: number;
                writeTokens: number;
                fullMissSteps: number;
            };
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        };
    } & {
        last: Sample | null;
        turn: TurnTotals | null;
        totals: Totals;
    };
    apply: (state: {
        provider: string | null;
        model: string | null;
        last: {
            billed: {
                hit: number;
                miss: number;
                output: number;
                currency: "CNY" | "USD";
                tier: "peak" | "offPeak" | "flat" | null;
                source: "estimate" | "cn" | "global" | "custom" | "off" | "catalog-miss";
                priced: boolean;
                estimated: boolean;
                catalogKey: string | null;
                catalogLabel: string | null;
                priceRow: {
                    inputMiss: number;
                    inputCacheHit: number;
                    output: number;
                } | null;
            };
            inputTokens: number;
            cacheReadTokens: number;
            cacheWriteTokens: number;
            outputTokens: number;
            model: string | null;
            provider: string | null;
            time: number;
            turn: number;
            step: number;
        } | null;
        turn: {
            id: number;
            inputTokens: number;
            cacheReadTokens: number;
            outputTokens: number;
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        } | null;
        totals: {
            counts: {
                inputTokens: number;
                cacheReadTokens: number;
                outputTokens: number;
                rounds: number;
                missSteps: number;
                writeTokens: number;
                fullMissSteps: number;
            };
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        };
    } & {
        last: Sample | null;
        turn: TurnTotals | null;
        totals: Totals;
    }, event: any) => {
        provider: string | null;
        model: string | null;
        last: {
            billed: {
                hit: number;
                miss: number;
                output: number;
                currency: "CNY" | "USD";
                tier: "peak" | "offPeak" | "flat" | null;
                source: "estimate" | "cn" | "global" | "custom" | "off" | "catalog-miss";
                priced: boolean;
                estimated: boolean;
                catalogKey: string | null;
                catalogLabel: string | null;
                priceRow: {
                    inputMiss: number;
                    inputCacheHit: number;
                    output: number;
                } | null;
            };
            inputTokens: number;
            cacheReadTokens: number;
            cacheWriteTokens: number;
            outputTokens: number;
            model: string | null;
            provider: string | null;
            time: number;
            turn: number;
            step: number;
        } | null;
        turn: {
            id: number;
            inputTokens: number;
            cacheReadTokens: number;
            outputTokens: number;
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        } | null;
        totals: {
            counts: {
                inputTokens: number;
                cacheReadTokens: number;
                outputTokens: number;
                rounds: number;
                missSteps: number;
                writeTokens: number;
                fullMissSteps: number;
            };
            money: {
                CNY: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
                USD: {
                    hitCost: number;
                    missCost: number;
                    outputCost: number;
                };
            };
        };
    } & {
        last: Sample | null;
        turn: TurnTotals | null;
        totals: Totals;
    };
    wire: {
        viewSchema: z.ZodObject<{
            available: z.ZodBoolean;
            cost: z.ZodNumber;
            missCost: z.ZodNumber;
            outputCost: z.ZodNumber;
            currency: z.ZodEnum<{
                CNY: "CNY";
                USD: "USD";
            }>;
            cacheReadTokens: z.ZodNumber;
            totalInputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            hitRate: z.ZodNullable<z.ZodNumber>;
            model: z.ZodNullable<z.ZodString>;
            provider: z.ZodNullable<z.ZodString>;
            matchedModel: z.ZodNullable<z.ZodString>;
            modelMatched: z.ZodBoolean;
            tier: z.ZodNullable<z.ZodEnum<{
                peak: "peak";
                offPeak: "offPeak";
                flat: "flat";
            }>>;
            unitPricePerM: z.ZodNullable<z.ZodNumber>;
            turn: z.ZodNullable<z.ZodNumber>;
            step: z.ZodNullable<z.ZodNumber>;
            priced: z.ZodBoolean;
            pricingSource: z.ZodNullable<z.ZodEnum<{
                estimate: "estimate";
                cn: "cn";
                global: "global";
                custom: "custom";
                off: "off";
                "catalog-miss": "catalog-miss";
            }>>;
            estimated: z.ZodBoolean;
            catalogKey: z.ZodNullable<z.ZodString>;
            catalogLabel: z.ZodNullable<z.ZodString>;
            priceRow: z.ZodNullable<z.ZodObject<{
                inputMiss: z.ZodNumber;
                inputCacheHit: z.ZodNumber;
                output: z.ZodNumber;
            }, z.core.$strip>>;
            turnCost: z.ZodNumber;
            turnHitCost: z.ZodNumber;
            turnMissCost: z.ZodNumber;
            turnOutputCost: z.ZodNumber;
            turnTokens: z.ZodNumber;
            turnCacheReadTokens: z.ZodNumber;
            turnInputTokens: z.ZodNumber;
            turnOutputTokens: z.ZodNumber;
            sessionCacheHitCost: z.ZodNumber;
            sessionMissCost: z.ZodNumber;
            sessionOutputCost: z.ZodNumber;
            sessionInputTokens: z.ZodNumber;
            sessionCacheReadTokens: z.ZodNumber;
            sessionOutputTokens: z.ZodNumber;
            sessionRounds: z.ZodNumber;
            sessionMissSteps: z.ZodNumber;
            sessionWriteTokens: z.ZodNumber;
            sessionFullMissSteps: z.ZodNumber;
            sessionByCurrency: z.ZodArray<z.ZodObject<{
                currency: z.ZodEnum<{
                    CNY: "CNY";
                    USD: "USD";
                }>;
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
            }, z.core.$strip>>;
            mixedCurrency: z.ZodBoolean;
        }, z.core.$strip>;
        view: (state: {
            provider: string | null;
            model: string | null;
            last: {
                billed: {
                    hit: number;
                    miss: number;
                    output: number;
                    currency: "CNY" | "USD";
                    tier: "peak" | "offPeak" | "flat" | null;
                    source: "estimate" | "cn" | "global" | "custom" | "off" | "catalog-miss";
                    priced: boolean;
                    estimated: boolean;
                    catalogKey: string | null;
                    catalogLabel: string | null;
                    priceRow: {
                        inputMiss: number;
                        inputCacheHit: number;
                        output: number;
                    } | null;
                };
                inputTokens: number;
                cacheReadTokens: number;
                cacheWriteTokens: number;
                outputTokens: number;
                model: string | null;
                provider: string | null;
                time: number;
                turn: number;
                step: number;
            } | null;
            turn: {
                id: number;
                inputTokens: number;
                cacheReadTokens: number;
                outputTokens: number;
                money: {
                    CNY: {
                        hitCost: number;
                        missCost: number;
                        outputCost: number;
                    };
                    USD: {
                        hitCost: number;
                        missCost: number;
                        outputCost: number;
                    };
                };
            } | null;
            totals: {
                counts: {
                    inputTokens: number;
                    cacheReadTokens: number;
                    outputTokens: number;
                    rounds: number;
                    missSteps: number;
                    writeTokens: number;
                    fullMissSteps: number;
                };
                money: {
                    CNY: {
                        hitCost: number;
                        missCost: number;
                        outputCost: number;
                    };
                    USD: {
                        hitCost: number;
                        missCost: number;
                        outputCost: number;
                    };
                };
            };
        } & {
            last: Sample | null;
            turn: TurnTotals | null;
            totals: Totals;
        }) => {
            available: boolean;
            cost: number;
            missCost: number;
            outputCost: number;
            currency: Currency;
            cacheReadTokens: number;
            totalInputTokens: number;
            outputTokens: number;
            hitRate: null;
            model: string | null;
            provider: string | null;
            matchedModel: null;
            modelMatched: boolean;
            tier: null;
            unitPricePerM: null;
            turn: null;
            step: null;
            priced: boolean;
            pricingSource: null;
            estimated: boolean;
            catalogKey: null;
            catalogLabel: null;
            priceRow: null;
            turnCost: number;
            turnHitCost: number;
            turnMissCost: number;
            turnOutputCost: number;
            turnTokens: number;
            turnCacheReadTokens: number;
            turnInputTokens: number;
            turnOutputTokens: number;
            sessionCacheHitCost: number;
            sessionMissCost: number;
            sessionOutputCost: number;
            sessionInputTokens: number;
            sessionCacheReadTokens: number;
            sessionOutputTokens: number;
            sessionRounds: number;
            sessionMissSteps: number;
            sessionWriteTokens: number;
            sessionFullMissSteps: number;
            sessionByCurrency: never[];
            mixedCurrency: boolean;
        } | {
            available: boolean;
            cost: number;
            missCost: number;
            outputCost: number;
            currency: Currency;
            cacheReadTokens: number;
            totalInputTokens: number;
            outputTokens: number;
            hitRate: number | null;
            model: string | null;
            provider: string | null;
            matchedModel: string | null;
            modelMatched: boolean;
            tier: "peak" | "offPeak" | "flat" | null;
            /** @deprecated 目录化后请以 priceRow 三价目位为准；保留一代 = 当前行缓存命中价。 */
            unitPricePerM: number | null;
            turn: number;
            step: number;
            priced: boolean;
            pricingSource: "estimate" | "cn" | "global" | "custom" | "off" | "catalog-miss";
            estimated: boolean;
            catalogKey: string | null;
            catalogLabel: string | null;
            priceRow: ({
                inputMiss: number;
                inputCacheHit: number;
                output: number;
            } & PriceRow) | null;
            turnCost: number;
            turnHitCost: number;
            turnMissCost: number;
            turnOutputCost: number;
            turnTokens: number;
            turnCacheReadTokens: number;
            turnInputTokens: number;
            turnOutputTokens: number;
            sessionCacheHitCost: number;
            sessionMissCost: number;
            sessionOutputCost: number;
            sessionInputTokens: number;
            sessionCacheReadTokens: number;
            sessionOutputTokens: number;
            sessionRounds: number;
            sessionMissSteps: number;
            sessionWriteTokens: number;
            sessionFullMissSteps: number;
            sessionByCurrency: {
                hitCost: number;
                missCost: number;
                outputCost: number;
                currency: "CNY" | "USD";
            }[];
            mixedCurrency: boolean;
        };
    };
};
/** 设置面 defaultPricing 值域（index.ts schema 与本模块共用，防漂移）。 */
export { POLICY_VALUES };
