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
import { resolveRate, } from "./price-catalog.js";
// 日历与峰谷判定迁至目录模块；旧导入面在此保持兼容（tests/index 均走本模块）。
export { isPeakBeijing, HOLIDAY_TABLE_2026, HOLIDAY_TABLES } from "./price-catalog.js";
export { PRICE_CATALOG, CATALOG_VERSION } from "./price-catalog.js";
/** 目录外模型的兜底档位（设置面 defaultPricing 的值域）。 */
const POLICY_VALUES = ['estimate', 'cn', 'global', 'custom', 'off'];
const round9 = (n) => Math.round(n * 1e9) / 1e9;
/** 写失效：发生过缓存写入（官方不报，恒 false，个别中转有值）。 */
export const isWriteMiss = (s) => s.cacheWriteTokens > 0;
/** 完全失效：有输入但缓存命中为 0（首轮无缓存可命中也算，近似，任何路由可靠）。 */
export const isFullMiss = (s) => s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens > 0 && s.cacheReadTokens === 0;
const sampleInput = (s) => s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens;
const ZERO_MONEY = () => ({ hitCost: 0, missCost: 0, outputCost: 0 });
const ZERO_BUCKETS = () => ({ CNY: ZERO_MONEY(), USD: ZERO_MONEY() });
const EMPTY_COUNTS = {
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    rounds: 0,
    missSteps: 0,
    writeTokens: 0,
    fullMissSteps: 0,
};
const emptyTotals = () => ({ counts: { ...EMPTY_COUNTS }, money: ZERO_BUCKETS() });
/** 折入时刻结算：按解析出的费率行算三笔（off → 恒 0 且 priced=false）。 */
export function billFor(sample, snapshot) {
    const resolved = resolveRate(sample.model, sample.provider, sample.time, snapshot);
    const { row } = resolved;
    if (row === null || !resolved.priced) {
        return {
            hit: 0, miss: 0, output: 0,
            currency: resolved.currency ?? 'CNY',
            tier: resolved.tier, source: resolved.source, priced: false, estimated: false,
            catalogKey: resolved.entry?.key ?? null,
            catalogLabel: resolved.entry?.label ?? null,
            priceRow: null,
        };
    }
    return {
        hit: round9((sample.cacheReadTokens * row.inputCacheHit) / 1e6),
        miss: round9(((sample.inputTokens + sample.cacheWriteTokens) * row.inputMiss) / 1e6),
        output: round9((sample.outputTokens * row.output) / 1e6),
        currency: resolved.currency ?? 'CNY',
        tier: resolved.tier, source: resolved.source, priced: true,
        estimated: resolved.estimated,
        catalogKey: resolved.entry?.key ?? null,
        catalogLabel: resolved.entry?.label ?? null,
        priceRow: { ...row },
    };
}
const billedShape = z.object({
    hit: z.number(),
    miss: z.number(),
    output: z.number(),
    currency: z.enum(['CNY', 'USD']),
    tier: z.enum(['peak', 'offPeak', 'flat']).nullable(),
    source: z.enum(['estimate', 'cn', 'global', 'custom', 'off', 'catalog-miss']),
    priced: z.boolean(),
    estimated: z.boolean(),
    catalogKey: z.string().nullable(),
    catalogLabel: z.string().nullable(),
    priceRow: z.object({ inputMiss: z.number(), inputCacheHit: z.number(), output: z.number() }).nullable(),
});
const sampleSchemaFields = {
    inputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheWriteTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    model: z.string().nullable(),
    provider: z.string().nullable(),
    time: z.number(),
};
const moneyShape = z.object({ hitCost: z.number(), missCost: z.number(), outputCost: z.number() });
const bucketsShape = z.object({ CNY: moneyShape, USD: moneyShape });
const countersShape = {
    inputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    rounds: z.number().int().nonnegative(),
    missSteps: z.number().int().nonnegative(),
    writeTokens: z.number().int().nonnegative(),
    fullMissSteps: z.number().int().nonnegative(),
};
const turnTotalsShape = {
    id: z.number().int(),
    inputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    money: bucketsShape,
};
/**
 * Build the `tlCacheBilling` projection definition. Registered soft-coupled
 * (runtime inject — NEVER a top-level export inject, which would make the
 * whole plugin 0.2.0-only): hosts without the sessionProjections service
 * simply never register it, and the ring's billing section stays hidden.
 * @param getPricing - 折入时刻的计价快照读取（O(1)，由插件 config 派生）。
 */
export function buildBillingDefinition(getPricing) {
    const stateSchema = z.object({
        provider: z.string().nullable(),
        model: z.string().nullable(),
        last: z.object({ turn: z.number().int(), step: z.number().int(), ...sampleSchemaFields, billed: billedShape }).nullable(),
        turn: z.object(turnTotalsShape).nullable(),
        totals: z.object({ counts: z.object(countersShape), money: bucketsShape }),
    });
    const init = () => ({
        provider: null,
        model: null,
        last: null,
        turn: null,
        totals: emptyTotals(),
    });
    // Wire-format reducer: events arrive untyped off the transport mirror and
    // every field access below already narrows defensively.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apply = (state, event) => {
        // 当前请求的 provider/model 跟踪
        if (event.type === 'request/header') {
            const cfg = event.data?.header?.config;
            const provider = typeof cfg?.provider === 'string' && cfg.provider !== '' ? cfg.provider : state.provider;
            const model = typeof cfg?.model === 'string' && cfg.model !== '' ? cfg.model : state.model;
            return provider !== state.provider || model !== state.model ? { ...state, provider, model } : state;
        }
        if (event.type === 'request/context') {
            const raw = event.data?.model;
            const model = typeof raw === 'string' && raw !== '' ? raw : state.model;
            return model !== state.model ? { ...state, model } : state;
        }
        // usage 双源采样
        let turn;
        let step;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wire-format usage sample, normalized a few lines down
        let usage;
        let sourceModel;
        let sourceProvider;
        if (event.type === 'assistant/chunk' && event.data?.chunk?.type === 'usage') {
            turn = event.data.turn;
            step = event.data.step;
            usage = event.data.chunk.usage;
        }
        else if (event.type === 'assistant/message' && event.data?.usage !== undefined) {
            turn = event.data.turn;
            step = event.data.step;
            usage = event.data.usage;
            const source = event.data.message?.source;
            if (typeof source?.provider === 'string')
                sourceProvider = source.provider;
            if (typeof source?.model === 'string')
                sourceModel = source.model;
        }
        else {
            return state; // 无关事件：同一引用，驱动以 Object.is 把关变更流
        }
        if (usage === undefined || typeof turn !== 'number' || typeof step !== 'number')
            return state;
        const sample = {
            turn,
            step,
            inputTokens: Number(usage.inputTokens) || 0,
            cacheReadTokens: Number(usage.cacheReadTokens) || 0,
            cacheWriteTokens: Number(usage.cacheWriteTokens) || 0,
            outputTokens: Number(usage.outputTokens) || 0,
            model: sourceModel ?? state.model,
            provider: sourceProvider ?? state.provider,
            time: typeof event.time === 'number' ? event.time : Date.now(),
            // 凭证在折入时刻结算（事件时刻的费率 + 当时的计价快照）
            billed: { hit: 0, miss: 0, output: 0, currency: 'CNY', tier: null, source: 'off', priced: false, estimated: false, catalogKey: null, catalogLabel: null, priceRow: null },
        };
        sample.billed = billFor(sample, getPricing());
        const prev = state.last;
        // 同 step 替换样本：数据全同且凭证同值则引用不变
        if (prev !== null && prev.turn === turn && prev.step === step &&
            prev.inputTokens === sample.inputTokens &&
            prev.cacheReadTokens === sample.cacheReadTokens &&
            prev.cacheWriteTokens === sample.cacheWriteTokens &&
            prev.outputTokens === sample.outputTokens &&
            prev.model === sample.model && prev.provider === sample.provider &&
            prev.billed.hit === sample.billed.hit &&
            prev.billed.miss === sample.billed.miss &&
            prev.billed.output === sample.billed.output &&
            prev.billed.estimated === sample.billed.estimated &&
            prev.billed.currency === sample.billed.currency) {
            return state;
        }
        const writeMiss = isWriteMiss(sample);
        const fullMiss = isFullMiss(sample);
        const input = sampleInput(sample);
        /** 桶加减：add 为正、sub 为负贡献。 */
        const settle = (buckets, billed, sign) => {
            const bucket = buckets[billed.currency];
            return {
                ...buckets,
                [billed.currency]: {
                    hitCost: bucket.hitCost + sign * billed.hit,
                    missCost: bucket.missCost + sign * billed.miss,
                    outputCost: bucket.outputCost + sign * billed.output,
                },
            };
        };
        if (prev !== null && prev.turn === turn && prev.step === step) {
            // 同 step 替换：**减 prev 凭证记录值**（不重算），加新凭证。轮数不变。
            const turnBase = state.turn !== null && state.turn.id === prev.turn
                ? state.turn
                : { id: turn, inputTokens: 0, cacheReadTokens: 0, outputTokens: 0, money: ZERO_BUCKETS() };
            return {
                ...state,
                last: sample,
                turn: {
                    id: turn,
                    inputTokens: turnBase.inputTokens - sampleInput(prev) + input,
                    cacheReadTokens: turnBase.cacheReadTokens - prev.cacheReadTokens + sample.cacheReadTokens,
                    outputTokens: turnBase.outputTokens - prev.outputTokens + sample.outputTokens,
                    money: settle(settle(turnBase.money, prev.billed, -1), sample.billed, 1),
                },
                totals: {
                    counts: {
                        ...state.totals.counts,
                        inputTokens: state.totals.counts.inputTokens - sampleInput(prev) + input,
                        cacheReadTokens: state.totals.counts.cacheReadTokens - prev.cacheReadTokens + sample.cacheReadTokens,
                        outputTokens: state.totals.counts.outputTokens - prev.outputTokens + sample.outputTokens,
                        missSteps: state.totals.counts.missSteps - (isWriteMiss(prev) ? 1 : 0) + (writeMiss ? 1 : 0),
                        writeTokens: state.totals.counts.writeTokens - prev.cacheWriteTokens + sample.cacheWriteTokens,
                        fullMissSteps: state.totals.counts.fullMissSteps - (isFullMiss(prev) ? 1 : 0) + (fullMiss ? 1 : 0),
                    },
                    money: settle(settle(state.totals.money, prev.billed, -1), sample.billed, 1),
                },
            };
        }
        // 新 step：同 turn 累加 / 异 turn 重置；totals 累加、轮数+1
        const sameTurn = state.turn !== null && state.turn.id === turn;
        return {
            ...state,
            last: sample,
            turn: sameTurn
                ? {
                    ...state.turn,
                    inputTokens: state.turn.inputTokens + input,
                    cacheReadTokens: state.turn.cacheReadTokens + sample.cacheReadTokens,
                    outputTokens: state.turn.outputTokens + sample.outputTokens,
                    money: settle(state.turn.money, sample.billed, 1),
                }
                : {
                    id: turn,
                    inputTokens: input,
                    cacheReadTokens: sample.cacheReadTokens,
                    outputTokens: sample.outputTokens,
                    money: settle(ZERO_BUCKETS(), sample.billed, 1),
                },
            totals: {
                counts: {
                    ...state.totals.counts,
                    inputTokens: state.totals.counts.inputTokens + input,
                    cacheReadTokens: state.totals.counts.cacheReadTokens + sample.cacheReadTokens,
                    outputTokens: state.totals.counts.outputTokens + sample.outputTokens,
                    rounds: state.totals.counts.rounds + 1,
                    missSteps: state.totals.counts.missSteps + (writeMiss ? 1 : 0),
                    writeTokens: state.totals.counts.writeTokens + sample.cacheWriteTokens,
                    fullMissSteps: state.totals.counts.fullMissSteps + (fullMiss ? 1 : 0),
                },
                money: settle(state.totals.money, sample.billed, 1),
            },
        };
    };
    const view = (state) => {
        const s = state.last;
        const t = state.totals;
        const sessionByCurrency = (buckets) => ['CNY', 'USD']
            .filter((c) => buckets[c].hitCost > 0 || buckets[c].missCost > 0 || buckets[c].outputCost > 0)
            .map((c) => ({ currency: c, ...buckets[c] }));
        if (s === null) {
            return {
                available: false, cost: 0, missCost: 0, outputCost: 0, currency: 'CNY',
                cacheReadTokens: 0, totalInputTokens: 0, outputTokens: 0, hitRate: null,
                model: state.model, provider: state.provider, matchedModel: null, modelMatched: false,
                tier: null, unitPricePerM: null, turn: null, step: null,
                priced: false, pricingSource: null, estimated: false, catalogKey: null, catalogLabel: null, priceRow: null,
                turnCost: 0, turnHitCost: 0, turnMissCost: 0, turnOutputCost: 0,
                turnTokens: 0, turnCacheReadTokens: 0, turnInputTokens: 0, turnOutputTokens: 0,
                sessionCacheHitCost: 0, sessionMissCost: 0, sessionOutputCost: 0,
                sessionInputTokens: 0, sessionCacheReadTokens: 0,
                sessionOutputTokens: 0, sessionRounds: 0, sessionMissSteps: 0,
                sessionWriteTokens: 0, sessionFullMissSteps: 0,
                sessionByCurrency: [], mixedCurrency: false,
            };
        }
        const totalInput = sampleInput(s);
        const b = s.billed;
        const currency = b.currency;
        const turn = state.turn;
        const turnMoney = turn === null ? ZERO_MONEY() : turn.money[currency];
        const primary = t.money[currency];
        return {
            available: totalInput > 0 || s.outputTokens > 0,
            cost: b.hit, missCost: b.miss, outputCost: b.output,
            currency,
            cacheReadTokens: s.cacheReadTokens,
            totalInputTokens: totalInput,
            outputTokens: s.outputTokens,
            hitRate: totalInput > 0 ? Math.round((s.cacheReadTokens / totalInput) * 1000) / 10 : null,
            model: s.model,
            provider: s.provider,
            matchedModel: b.catalogLabel,
            modelMatched: b.source !== 'catalog-miss',
            tier: b.tier,
            /** @deprecated 目录化后请以 priceRow 三价目位为准；保留一代 = 当前行缓存命中价。 */
            unitPricePerM: b.priceRow?.inputCacheHit ?? null,
            turn: s.turn,
            step: s.step,
            priced: b.priced,
            pricingSource: b.source,
            estimated: b.estimated,
            catalogKey: b.catalogKey,
            catalogLabel: b.catalogLabel,
            priceRow: b.priceRow,
            turnCost: turnMoney.hitCost + turnMoney.missCost + turnMoney.outputCost,
            turnHitCost: turnMoney.hitCost,
            turnMissCost: turnMoney.missCost,
            turnOutputCost: turnMoney.outputCost,
            turnTokens: turn === null ? 0 : turn.inputTokens + turn.outputTokens,
            turnCacheReadTokens: turn === null ? 0 : turn.cacheReadTokens,
            turnInputTokens: turn === null ? 0 : turn.inputTokens,
            turnOutputTokens: turn === null ? 0 : turn.outputTokens,
            sessionCacheHitCost: primary.hitCost,
            sessionMissCost: primary.missCost,
            sessionOutputCost: primary.outputCost,
            sessionInputTokens: t.counts.inputTokens,
            sessionCacheReadTokens: t.counts.cacheReadTokens,
            sessionOutputTokens: t.counts.outputTokens,
            sessionRounds: t.counts.rounds,
            sessionMissSteps: t.counts.missSteps,
            sessionWriteTokens: t.counts.writeTokens,
            sessionFullMissSteps: t.counts.fullMissSteps,
            sessionByCurrency: sessionByCurrency(t.money),
            mixedCurrency: sessionByCurrency(t.money).length > 1,
        };
    };
    const viewSchema = z.object({
        available: z.boolean(),
        cost: z.number(),
        missCost: z.number(),
        outputCost: z.number(),
        currency: z.enum(['CNY', 'USD']),
        cacheReadTokens: z.number().int().nonnegative(),
        totalInputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        hitRate: z.number().nullable(),
        model: z.string().nullable(),
        provider: z.string().nullable(),
        matchedModel: z.string().nullable(),
        modelMatched: z.boolean(),
        tier: z.enum(['peak', 'offPeak', 'flat']).nullable(),
        unitPricePerM: z.number().nullable(),
        turn: z.number().int().nullable(),
        step: z.number().int().nullable(),
        priced: z.boolean(),
        pricingSource: z.enum(['estimate', 'cn', 'global', 'custom', 'off', 'catalog-miss']).nullable(),
        estimated: z.boolean(),
        catalogKey: z.string().nullable(),
        catalogLabel: z.string().nullable(),
        priceRow: z.object({ inputMiss: z.number(), inputCacheHit: z.number(), output: z.number() }).nullable(),
        turnCost: z.number().nonnegative(),
        turnHitCost: z.number().nonnegative(),
        turnMissCost: z.number().nonnegative(),
        turnOutputCost: z.number().nonnegative(),
        turnTokens: z.number().int().nonnegative(),
        turnCacheReadTokens: z.number().int().nonnegative(),
        turnInputTokens: z.number().int().nonnegative(),
        turnOutputTokens: z.number().int().nonnegative(),
        sessionCacheHitCost: z.number().nonnegative(),
        sessionMissCost: z.number().nonnegative(),
        sessionOutputCost: z.number().nonnegative(),
        sessionInputTokens: z.number().int().nonnegative(),
        sessionCacheReadTokens: z.number().int().nonnegative(),
        sessionOutputTokens: z.number().int().nonnegative(),
        sessionRounds: z.number().int().nonnegative(),
        sessionMissSteps: z.number().int().nonnegative(),
        sessionWriteTokens: z.number().int().nonnegative(),
        sessionFullMissSteps: z.number().int().nonnegative(),
        sessionByCurrency: z.array(z.object({ currency: z.enum(['CNY', 'USD']), hitCost: z.number().nonnegative(), missCost: z.number().nonnegative(), outputCost: z.number().nonnegative() })),
        mixedCurrency: z.boolean(),
    });
    return {
        key: 'tlCacheBilling',
        stateVersion: 3,
        stateSchema,
        init,
        apply,
        wire: { viewSchema, view },
    };
}
/** 设置面 defaultPricing 值域（index.ts schema 与本模块共用，防漂移）。 */
export { POLICY_VALUES };
