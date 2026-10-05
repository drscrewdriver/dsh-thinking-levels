/**
 * TL cache-billing projection unit (`tlCacheBilling`).
 *
 * Accounting semantics ported from better-er/dsh-cache-billing (read line by
 * line, see .agents/plans/tl-billing-popover): usage samples from
 * assistant/chunk (type 'usage') and assistant/message (data.usage), same-step
 * replacement settles old-minus-new, turn aggregation resets on turn switch,
 * session totals price every sample at its own event-time rate.
 *
 * Pricing: single model DeepSeek-V4.1-Flash, Beijing-time peak/off-peak
 * (workdays 09-12 & 14-18 peak, weekends and CN statutory holidays off-peak
 * all day; pure UTC+8 math, never the local clock). Unmatched model names are
 * still priced at Flash rates and flagged via modelMatched=false.
 *
 * Schema library: the projection framework duck-types `stateSchema.parse()` /
 * `wire.viewSchema.parse()` (dsh-session-projection lib:255/259/305), so these
 * MUST be real zod objects — schemastery has no parse. zod ^4.4.3 rides in
 * dependencies (TL's tsc build does not bundle).
 * @module dsh-thinking-levels/billing-projection
 */
import { z } from 'zod';
/** 谷价费率行（元/百万 token）——价目表的基准列。 */
export interface RateRow {
    cacheHit: number;
    cacheMiss: number;
    output: number;
}
/** 账目只认 DeepSeek-V4.1-Flash：现名、旧名与历史变体全部由 Flash 服务。 */
export declare const BILLING_MODEL: {
    readonly key: "deepseek-v4.1-flash";
    readonly label: "DeepSeek-V4.1-Flash";
    readonly aliases: readonly ["deepseek-v4.1-flash", "deepseek-flash", "deepseek-v4-flash", "deepseek-v4-flash-vision-exp"];
    readonly peak: {
        readonly cacheHit: 0.04;
        readonly cacheMiss: 2;
        readonly output: 8;
    };
    readonly offPeak: {
        readonly cacheHit: 0.02;
        readonly cacheMiss: 1;
        readonly output: 4;
    };
};
export type Tier = 'peak' | 'offPeak';
/**
 * 中国法定节假日放假日（北京时间 YYYY-MM-DD），2026 年国务院安排 33 天（holiday-cn）。
 * 只收放假日不收调休补班周末；表外年份退化为只认周末。
 */
export declare const HOLIDAYS_2026: ReadonlySet<string>;
/** 时刻是否为北京高峰。UTC+8 纯数学换算；无效时间戳用 getUTC* 拼串不抛错。 */
export declare function isPeakBeijing(timeMs: number): boolean;
/** 模型在某时刻的费率行 + 峰谷 + 白名单命中标记。 */
export declare function rateOf(model: string | null, timeMs: number): {
    row: RateRow;
    tier: Tier;
    matchedModel: string;
    matched: boolean;
};
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
}
/** 会话累计：跨轮逐笔按各自事件时刻费率计价。 */
export interface Totals {
    cacheHitCost: number;
    missCost: number;
    outputCost: number;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
    rounds: number;
    missSteps: number;
    writeTokens: number;
    fullMissSteps: number;
}
/** 当前轮累计：turn 切换重置。 */
export interface TurnTotals {
    id: number;
    hitCost: number;
    missCost: number;
    outputCost: number;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
}
export interface ProjectionState {
    provider: string | null;
    model: string | null;
    last: Sample | null;
    turn: TurnTotals | null;
    totals: Totals;
}
/** 按样本模型与事件时刻计一轮三笔费用（元）。 */
export declare function costOf(sample: Sample): {
    hit: number;
    miss: number;
    output: number;
};
/** 写失效：发生过缓存写入（官方不报，恒 false，个别中转有值）。 */
export declare const isWriteMiss: (s: Sample) => boolean;
/** 完全失效：有输入但缓存命中为 0（首轮无缓存可命中也算，近似，任何路由可靠）。 */
export declare const isFullMiss: (s: Sample) => boolean;
/**
 * Build the `tlCacheBilling` projection definition. Registered soft-coupled
 * (runtime inject — NEVER a top-level export inject, which would make the
 * whole plugin 0.2.0-only): hosts without the sessionProjections service
 * simply never register it, and the ring's billing section stays hidden.
 */
export declare function buildBillingDefinition(): {
    key: string;
    stateVersion: number;
    stateSchema: z.ZodObject<{
        provider: z.ZodNullable<z.ZodString>;
        model: z.ZodNullable<z.ZodString>;
        last: z.ZodNullable<z.ZodObject<{
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
            hitCost: z.ZodNumber;
            missCost: z.ZodNumber;
            outputCost: z.ZodNumber;
            inputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
        }, z.core.$strip>>;
        totals: z.ZodObject<{
            cacheHitCost: z.ZodNumber;
            missCost: z.ZodNumber;
            outputCost: z.ZodNumber;
            inputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            rounds: z.ZodNumber;
            missSteps: z.ZodNumber;
            writeTokens: z.ZodNumber;
            fullMissSteps: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    init: () => {
        provider: string | null;
        model: string | null;
        last: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["last"];
        turn: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["turn"];
        totals: Totals;
    };
    apply: (state: {
        provider: string | null;
        model: string | null;
        last: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["last"];
        turn: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["turn"];
        totals: Totals;
    }, event: any) => {
        provider: string | null;
        model: string | null;
        last: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["last"];
        turn: z.infer<z.ZodObject<{
            provider: z.ZodNullable<z.ZodString>;
            model: z.ZodNullable<z.ZodString>;
            last: z.ZodNullable<z.ZodObject<{
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
                hitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
            }, z.core.$strip>>;
            totals: z.ZodObject<{
                cacheHitCost: z.ZodNumber;
                missCost: z.ZodNumber;
                outputCost: z.ZodNumber;
                inputTokens: z.ZodNumber;
                cacheReadTokens: z.ZodNumber;
                outputTokens: z.ZodNumber;
                rounds: z.ZodNumber;
                missSteps: z.ZodNumber;
                writeTokens: z.ZodNumber;
                fullMissSteps: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>["turn"];
        totals: Totals;
    };
    wire: {
        viewSchema: z.ZodObject<{
            available: z.ZodBoolean;
            cost: z.ZodNumber;
            missCost: z.ZodNumber;
            outputCost: z.ZodNumber;
            currency: z.ZodLiteral<"CNY">;
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
            }>>;
            unitPricePerM: z.ZodNullable<z.ZodNumber>;
            turn: z.ZodNullable<z.ZodNumber>;
            step: z.ZodNullable<z.ZodNumber>;
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
        }, z.core.$strip>;
        view: (state: {
            provider: string | null;
            model: string | null;
            last: z.infer<z.ZodObject<{
                provider: z.ZodNullable<z.ZodString>;
                model: z.ZodNullable<z.ZodString>;
                last: z.ZodNullable<z.ZodObject<{
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
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                    inputTokens: z.ZodNumber;
                    cacheReadTokens: z.ZodNumber;
                    outputTokens: z.ZodNumber;
                }, z.core.$strip>>;
                totals: z.ZodObject<{
                    cacheHitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                    inputTokens: z.ZodNumber;
                    cacheReadTokens: z.ZodNumber;
                    outputTokens: z.ZodNumber;
                    rounds: z.ZodNumber;
                    missSteps: z.ZodNumber;
                    writeTokens: z.ZodNumber;
                    fullMissSteps: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>>["last"];
            turn: z.infer<z.ZodObject<{
                provider: z.ZodNullable<z.ZodString>;
                model: z.ZodNullable<z.ZodString>;
                last: z.ZodNullable<z.ZodObject<{
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
                    hitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                    inputTokens: z.ZodNumber;
                    cacheReadTokens: z.ZodNumber;
                    outputTokens: z.ZodNumber;
                }, z.core.$strip>>;
                totals: z.ZodObject<{
                    cacheHitCost: z.ZodNumber;
                    missCost: z.ZodNumber;
                    outputCost: z.ZodNumber;
                    inputTokens: z.ZodNumber;
                    cacheReadTokens: z.ZodNumber;
                    outputTokens: z.ZodNumber;
                    rounds: z.ZodNumber;
                    missSteps: z.ZodNumber;
                    writeTokens: z.ZodNumber;
                    fullMissSteps: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>>["turn"];
            totals: Totals;
        }) => {
            available: boolean;
            cost: number;
            missCost: number;
            outputCost: number;
            currency: "CNY";
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
        } | {
            available: boolean;
            cost: number;
            missCost: number;
            outputCost: number;
            currency: "CNY";
            cacheReadTokens: number;
            totalInputTokens: number;
            outputTokens: number;
            hitRate: number | null;
            model: string | null;
            provider: string | null;
            matchedModel: string;
            modelMatched: boolean;
            tier: Tier;
            unitPricePerM: number;
            turn: number;
            step: number;
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
        };
    };
};
