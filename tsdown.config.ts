/**
 * Independent tsdown preset for the dsh-thinking-levels client half, mirroring
 * deepseek-harness/packages/client/tsdown.client.ts semantics:
 *
 * - browser half: src/client/index.ts -> lib/client.js (CJS, browser) with the
 *   __ModuleLoader__.load closure-factory banner and the platform externals
 *   table. The node half stays on plain `tsc` (lib/index.js + .d.ts).
 *
 * The browser bundle is served by dsh-client-modules at
 * /plugins/dsh-thinking-levels/client.js; every @deepseek-ai/* value import
 * must be a platform module (external) or an inline-safe wire layer — this
 * client half only type-imports @deepseek-ai/* packages (erased before the
 * gate), and the purity gate below enforces that.
 */
import type { UserConfig } from 'tsdown'

/** Plugin id stamped into the loader handoff. */
const PLUGIN_ID = 'dsh-thinking-levels'

/** The module specifiers the shell shares into the frozen module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
] as const

/** Externals resolved from the loader module table. */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES]

const clientConfig: UserConfig = {
  name: `${PLUGIN_ID}/client`,
  entry: { client: 'src/client/index.ts' },
  // Browser bundle lands next to the node half (single lib/ artifact dir).
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: [...CLIENT_EXTERNALS],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
  plugins: [{
    name: 'dsh-client-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (CLIENT_EXTERNALS.includes(source)) return null
      throw new Error(
        `client bundle purity: "${source}" is not a platform module —cross-plugin value imports are forbidden; `
        + 'collaborate through cordis services (type-only imports are erased and never reach this gate)',
      )
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [clientConfig]
