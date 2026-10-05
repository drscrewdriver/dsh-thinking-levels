/** One `describe()` pass over the live settings, or `undefined` when the service is absent. */
export function describeSettings(ctx) {
    const settings = ctx.get('settings');
    return settings?.describe?.();
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
