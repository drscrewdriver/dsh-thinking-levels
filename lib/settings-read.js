/**
 * 形状归一（唯一一处 unwrap）：进程内 `describe()` 交回描述符数组；Remote/RPC
 * 信封交回 `{writable, hasDocument, namespaces:[…]}`。其余形状（含 undefined）
 * 一律当「不可用」返回 undefined，不得让 `find is not a function` 这类
 * TypeError 泄到调用方被 catch 吞成静默冻结（同生态 fail-open 坑先例）。
 */
export function normalizeDescriptors(raw) {
    if (Array.isArray(raw))
        return raw;
    const wrapped = raw;
    if (wrapped !== null && typeof wrapped === 'object' && Array.isArray(wrapped.namespaces)) {
        return wrapped.namespaces;
    }
    return undefined;
}
/** One `describe()` pass over the live settings, or `undefined` when the service is absent. */
export function describeSettings(ctx) {
    const settings = ctx.get('settings');
    return normalizeDescriptors(settings?.describe?.());
}
/**
 * Read one namespace's live section. `undefined` when the settings service is
 * absent or the namespace is not an active profile entry (owning plugin not
 * installed / not composed).
 */
export function readSection(ctx, ns) {
    return readSectionOf(describeSettings(ctx), ns);
}
/** Pick one namespace out of a `describe()` pass (undefined when absent). */
export function readSectionOf(descriptors, ns) {
    const found = descriptors?.find((descriptor) => descriptor.ns === ns);
    if (found === undefined)
        return undefined;
    return { value: found.value, revision: found.revision };
}
/**
 * Pick the first candidate namespace a `describe()` pass actually carries.
 * Composition entry ids shifted shape across a plugin's own packaging history
 * (e.g. the openai-completions transport's `dsh-llm-openai-completions` since
 * its 0.4.0 fragment vs the short form earlier manual installs used), so
 * cross-plugin readers resolve the LIVE id instead of hardcoding one — the
 * winner is shape-detected from the document, never version-guessed.
 */
export function resolveNamespaceOf(descriptors, candidates) {
    for (const ns of candidates) {
        const read = readSectionOf(descriptors, ns);
        if (read !== undefined)
            return { ...read, ns };
    }
    return undefined;
}
