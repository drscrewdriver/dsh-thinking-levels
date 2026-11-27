/**
 * Built-in mainstream-model effort-tier catalog (N2 / 4.9.0).
 *
 * Pure data + pure functions, zero runtime deps, unit-testable. One entry per
 * vendor FAMILY: which host slider levels the family supports, the wire
 * spelling each level takes on that vendor's API, the vendor's own default,
 * and whether thinking can be turned off at all. Narrower `variants` override
 * family data for exceptional models (Claude 4.6 lacking `xhigh`, Gemini 3.5
 * flash gaining `minimal`, …).
 *
 * Data policy (see plan findings §1): every family carries `source.url` +
 * `retrievedAt`; anything not confirmed first-hand stays `confidence:'low'`
 * and must NOT produce suggested writes. Wire values are information pinned
 * from vendor docs — this module never guesses a spelling.
 */
import type { EffortId } from './thinking-level.ts';
/** Host-model levels that can carry a wire mapping (`on`/`auto` are plugin-side only). */
export type WireLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
/** The seven host levels, in slider order — the catalog's key domain. */
export declare const WIRE_LEVELS: readonly WireLevel[];
/** A narrower exception inside a family; each present key replaces the family value. */
export interface EffortTierVariant {
    modelMatch: readonly RegExp[];
    wires?: Partial<Record<WireLevel, string>>;
    vendorDefault?: EffortId;
}
export interface EffortTierFamily {
    id: string;
    label: string;
    /** All non-empty match lists present must hit (provider AND model). */
    providerMatch: readonly RegExp[];
    modelMatch: readonly RegExp[];
    /** Host level -> wire spelling; absent key = level unsupported by this family. */
    wires: Partial<Record<WireLevel, string>>;
    vendorDefault: EffortId;
    canDisable: boolean;
    /** Family exposes only an on/off thinking toggle, no effort gradient. */
    toggleOnly: boolean;
    /** `low` = not first-hand confirmed -> display-only, never suggested. */
    confidence: 'high' | 'low';
    /** Evaluated before the family defaults; first matching variant wins. */
    variants?: readonly EffortTierVariant[];
    source: {
        url: string;
        retrievedAt: string;
    };
    /** Data caveats carried verbatim from the research notes. */
    notes?: string;
}
/** A resolved per-model tier view: family data with the winning variant merged. */
export interface ResolvedTier {
    family: EffortTierFamily;
    wires: Partial<Record<WireLevel, string>>;
    vendorDefault: EffortId;
    canDisable: boolean;
    toggleOnly: boolean;
    confidence: 'high' | 'low';
}
export declare const EFFORT_TIER_FAMILIES: readonly EffortTierFamily[];
/**
 * The family for a model line. Model ids embed the vendor (grok-4.6, claude-*,
 * deepseek-* …), so `modelMatch` is the primary key — a gateway that serves the
 * model under a different provider name (openrouter/deepseek-v4-pro) still
 * resolves. `providerMatch` only disambiguates when several families hit the
 * same model id; the first array-order match wins otherwise.
 */
export declare function matchEffortFamily(provider: string, model: string): EffortTierFamily | undefined;
/** Family data with the first matching variant merged over it. */
export declare function resolveTier(provider: string, model: string): ResolvedTier | undefined;
/**
 * The `reasoningEfforts` shape the llm-pi-ai user layer takes:
 * `Partial<Record<WireLevel, string | null>>` — wire spelling per supported
 * level, `off: null` when the family can disable thinking (null = the host's
 * "no wire value, strip the param" convention), absent for unsupported levels.
 * Toggle-only families produce an empty map (there is nothing to write).
 */
export declare function reasoningEffortsOf(tier: Pick<ResolvedTier, 'wires' | 'canDisable' | 'toggleOnly'>): Partial<Record<WireLevel, string | null>>;
