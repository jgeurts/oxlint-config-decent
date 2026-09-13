import { type UserConfig } from 'vite';
import { defineConfig } from 'vite-plus';

import { oxlintConfig } from './src/index.js';

const config: UserConfig = defineConfig({
  fmt: {
    arrowParens: 'always',
    bracketSpacing: true,
    printWidth: 200,
    quoteProps: 'as-needed',
    semi: true,
    useTabs: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    sortPackageJson: false,
    ignorePatterns: ['CHANGELOG.md'],
  },
  // Dogfood this package's own config. The estree-dependent compat plugins
  // (typescript-compat, vitest-compat, testing-library) load because
  // `typescript` is aliased to @typescript/typescript6 (the official TS 7
  // side-by-side arrangement — TS 6.0 JS API, while tsc comes from
  // @typescript/native). The 'decent' jsPlugin resolves via package
  // self-reference to dist, so `vp pack` must run before `vp lint`.
  lint: oxlintConfig({
    enableReact: false,
    enableNextJs: false,
  }),
  pack: {
    entry: ['src/index.ts', 'src/oxlint.ts', 'src/plugin.ts'],
    format: ['esm', 'cjs'],
    dts: { oxc: {} },
    // Match the output layout referenced by package.json
    // (index.mjs + index.d.ts for ESM, index.cjs + index.d.cts for CJS).
    outExtensions: ({ format }) => (format === 'es' ? { js: '.mjs', dts: '.d.ts' } : { js: '.cjs', dts: '.d.cts' }),
  },
  staged: {
    '*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}': ['vp fmt', 'vp lint --fix'],
    '*.md': ['vp fmt --no-error-on-unmatched-pattern', 'markdownlint --config=.github/linters/.markdown-lint.yml --fix'],
    '*.{json,jsonc,json5,yml,yaml}': ['vp fmt --no-error-on-unmatched-pattern'],
  },
});

export default config;
