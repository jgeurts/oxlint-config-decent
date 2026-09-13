# oxlint-config-decent

[![NPM version](https://img.shields.io/npm/v/oxlint-config-decent.svg?style=flat)](https://npmjs.org/package/oxlint-config-decent)

A decent [oxlint](https://oxc.rs/docs/guide/usage/linter.html) configuration for TypeScript projects.

Uses native oxlint rules where available, `-compat` JS plugins for gap rules, and standalone JS plugins for the rest (~95% coverage of the original ESLint rule set). See [the rule coverage report](docs/oxlint-rule-coverage.md).

> This package is the successor to [`eslint-config-decent`](https://npmjs.org/package/eslint-config-decent). v5 dropped the ESLint config entirely — see [Migrating from eslint-config-decent](#migrating-from-eslint-config-decent-v4).

## Setup

```bash
npm install -D oxlint-config-decent oxlint oxlint-tsgolint eslint
```

npm (and pnpm 8+) automatically install the required peer dependencies (`oxlint-plugin-eslint`, `@stylistic/eslint-plugin`,
`@typescript-eslint/eslint-plugin`, `eslint-plugin-jsdoc`, `eslint-plugin-security`, `eslint-plugin-unicorn`). Installing `eslint`
explicitly keeps npm's peer resolver from picking conflicting ESLint versions for those plugins — it is only resolved as a peer,
never executed.

If you enable React support, `eslint-plugin-react` currently caps its `eslint` peer below what `eslint-plugin-unicorn` requires.
Tell npm to resolve it against your ESLint version:

```jsonc
// package.json
"overrides": {
  "eslint-plugin-react": {
    "eslint": "$eslint"
  }
}
```

```ts
// oxlint.config.ts

import { defineConfig } from 'oxlint';
import { oxlintConfig } from 'oxlint-config-decent';

export default defineConfig({
  extends: [
    oxlintConfig({
      enableNextJs: true,
      nextJsRootDir: '.',
    }),
  ],
});
```

Requires oxlint >= 1.53.0 for TypeScript config support.

### With Vite+

In a [Vite+](https://viteplus.dev) project, let Vite+ supply its bundled `oxlint` and `oxlint-tsgolint` versions:

```bash
pnpm add -D oxlint-config-decent vite-plus eslint
```

Do not add standalone `oxlint` or `oxlint-tsgolint` dependencies to a Vite+ project. Independently updating them can make the config's
types disagree with the version that `vp lint` runs. The `oxlint` peer is optional for this setup; standalone users must install it
as shown above. Keep `eslint` explicit so lockfile updates retain the runtime peer imported by compatibility plugins.

Put the config into the `lint` section of `vite.config.ts`:

```ts
// vite.config.ts

import { defineConfig } from 'vite-plus';
import { oxlintConfig } from 'oxlint-config-decent';

export default defineConfig({
  lint: oxlintConfig({ enableReact: false }),
});
```

## Feature flags

| Option                          | Default | Requires (peer)                          |
| ------------------------------- | ------- | ---------------------------------------- |
| `enableReact`                   | `true`  | `eslint-plugin-react`                    |
| `enableVitest`                  | `true`  | `@vitest/eslint-plugin`                  |
| `enableTestingLibrary`          | `true`  | `eslint-plugin-testing-library`          |
| `enableNextJs`                  | `false` | nothing (native oxlint plugin)           |
| `enableTypeScriptEstreePlugins` | `true`  | `@typescript-eslint/eslint-plugin`, etc. |

Two options tune plugin settings rather than toggle features: `reactVersion` sets the React version reported to `eslint-plugin-react`
(default `'19'`), and `nextJsRootDir` sets the Next.js root directory when `enableNextJs` is on (useful in monorepos where the Next.js
app is not at the repo root).

## Custom rules

The package ships its own oxlint JS plugin (exported at `oxlint-config-decent/plugin`) with two rules, both enabled by default and
auto-fixable:

- `decent/require-extension` — relative imports/exports must include a file extension (adapted from
  [eslint-plugin-require-extensions](https://github.com/solana-labs/eslint-plugin-require-extensions) to work with ESM)
- `decent/require-index` — directory imports/exports must reference `index.js` explicitly

Disable them like any other rule:

```ts
oxlintConfig(); // then override:
// rules: { 'decent/require-extension': 'off', 'decent/require-index': 'off' }
```

The React, Vitest, and Testing Library plugins are optional peer dependencies. They are enabled by default, so either install them or disable the flags:

```ts
oxlintConfig({
  enableReact: false,
  enableVitest: false,
  enableTestingLibrary: false,
});
```

## Type-aware linting

The config enables `options.typeAware` for use with [oxlint-tsgolint](https://github.com/oxc-project/tsgolint), which provides type-aware rules powered by TypeScript's Go port.

## Override a rule

```ts
// oxlint.config.ts

import { defineConfig } from 'oxlint';
import { oxlintConfig } from 'oxlint-config-decent';

export default defineConfig({
  extends: [oxlintConfig()],
  rules: {
    'typescript/no-confusing-void-expression': 'off',
  },
});
```

## Using TypeScript 7

TypeScript 7 does not ship the JS API that the typescript-compat, vitest-compat, and testing-library plugins need (they load
`@typescript-eslint/*` packages, which import `typescript` at lint time). The recommended fix is the official
[side-by-side arrangement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60):
alias `typescript` to Microsoft's `@typescript/typescript6` compatibility package (the TypeScript 6.0 JS API plus a `tsc6` binary) and
install TypeScript 7 under a separate alias:

```jsonc
// package.json
"devDependencies": {
  "@typescript/native": "npm:typescript@^7.0.2",
  "typescript": "npm:@typescript/typescript6@^6.0.2"
}
```

`tsc` keeps coming from TypeScript 7 (`@typescript/native`), while tools that import `typescript` — typescript-eslint and friends —
resolve the 6.0 API, so every rule in this config keeps working. The type-aware rules are unaffected either way: `oxlint-tsgolint`
drives the Go compiler directly and never touches the JS API. This repo dogfoods exactly that setup — see
[`package.json`](package.json) and [`vite.config.ts`](vite.config.ts).

If you would rather not carry the compatibility package, disable the estree-dependent plugins instead:

```ts
oxlintConfig({ enableTypeScriptEstreePlugins: false });
```

This drops the `typescript-compat/*` and `vitest-compat/*` gap rules (member ordering, explicit member accessibility, vitest padding
rules, and similar) and the testing-library rules. Everything else keeps working.

## Migrating from eslint-config-decent v4

- The npm package was renamed: `eslint-config-decent` → `oxlint-config-decent`. Versioning continues from v4 (this package starts at v5).
- If you used `eslint-config-decent/oxlint`, switch the import to `oxlint-config-decent` (the root export is now the oxlint config; the `/oxlint` subpath also still works):

  ```diff
  -import { oxlintConfig } from 'eslint-config-decent/oxlint';
  +import { oxlintConfig } from 'oxlint-config-decent';
  ```

- The ESLint config export (`config()`, `tsEslintConfig()`, and the per-plugin config arrays) was removed. If you still need ESLint, stay on `eslint-config-decent@4`.

## Agent Skill for AI-Assisted Development

This package includes an Agent Skill that teaches AI coding assistants (Claude Code, OpenCode, etc.) to follow the same TypeScript standards enforced by the lint rules.

### Installation

```bash
npx skills add jgeurts/oxlint-config-decent
```

Or copy manually:

```bash
mkdir -p .claude/skills
cp -r node_modules/oxlint-config-decent/skills/enforcing-typescript-standards .claude/skills/
```

> **Note**: The skill is copied to your project and won't update automatically. Re-run the install command after updating `oxlint-config-decent` to get the latest skill instructions.

### Usage

Once installed, AI assistants will automatically apply the project's TypeScript standards when creating or modifying `.ts` and `.tsx` files. The skill instructs the AI to:

- Write code with explicit return types and member accessibility
- Organize imports correctly (order, extensions, type-only imports)
- Follow class member ordering conventions
- Avoid anti-patterns like useless comments, nested ternaries, and `await` in loops
- Run the project's lint command to verify compliance before completing tasks

### Customizing the Skill

To override or extend the default instructions, edit the `SKILL.md` file in your project's skills directory.

## License

MIT
