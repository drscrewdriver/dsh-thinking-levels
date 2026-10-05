/**
 * Cross-namespace reads over the DSH 0.1.7+ settings service.
 *
 * `SettingsForms` (the service registered as `settings`) has no `get(ns)`:
 * the read channel is `describe()`, which returns every active profile
 * entry's live Config value with its schema projection and revision. The
 * `settings?.get?.(ns)` soft reads this plugin carried since the 0.1.7
 * migration were therefore silently dead on every supported host — this
 * module replaces them.
 *
 * Values are schema-projected by the host (`projectForm`), so only fields
 * the owning plugin's Config schema declares survive the round trip; the
 * `revision` is the write fence `settings.update(ns, patch, expectedRevision)`
 * accepts.
 * @module dsh-thinking-levels/settings-read
 */
import type { Context } from '@deepseek-ai/cordis';
/** Minimal face of the settings service this module reads. */
export interface SettingsServiceLike {
    describe?: () => SettingsDescriptorLike[];
}
/** One active profile entry as `describe()` reports it (minimal face). */
export interface SettingsDescriptorLike {
    ns: string;
    value: unknown;
    revision: number;
}
/** One namespace's live section value with its write fence. */
export interface SectionReadout<T = unknown> {
    value: T;
    revision: number;
}
/** One `describe()` pass over the live settings, or `undefined` when the service is absent. */
export declare function describeSettings(ctx: Context): SettingsDescriptorLike[] | undefined;
/**
 * Read one namespace's live section. `undefined` when the settings service is
 * absent or the namespace is not an active profile entry (owning plugin not
 * installed / not composed).
 */
export declare function readSection<T = unknown>(ctx: Context, ns: string): SectionReadout<T> | undefined;
/** Pick one namespace out of a `describe()` pass (undefined when absent). */
export declare function readSectionOf<T = unknown>(descriptors: SettingsDescriptorLike[] | undefined, ns: string): SectionReadout<T> | undefined;
/**
 * Pick the first candidate namespace a `describe()` pass actually carries.
 * Composition entry ids shifted shape across a plugin's own packaging history
 * (e.g. the openai-completions transport's `dsh-llm-openai-completions` since
 * its 0.4.0 fragment vs the short form earlier manual installs used), so
 * cross-plugin readers resolve the LIVE id instead of hardcoding one — the
 * winner is shape-detected from the document, never version-guessed.
 */
export declare function resolveNamespaceOf<T = unknown>(descriptors: SettingsDescriptorLike[] | undefined, candidates: readonly string[]): (SectionReadout<T> & {
    ns: string;
}) | undefined;
