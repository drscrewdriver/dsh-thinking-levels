/** The package ships no types (and is deprecated on React 19); the panel-run
 * harness only touches `create().toJSON()`/`root.*`, so a permissive ambient
 * module keeps `npm run typecheck` green without a dependency bump. */
declare module 'react-test-renderer' {
  export const create: (element: unknown) => {
    toJSON(): unknown
    root: unknown
    update(element: unknown): void
    unmount(): void
  }
  export const act: (fn: () => unknown) => unknown
}
