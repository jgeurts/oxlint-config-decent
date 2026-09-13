#!/usr/bin/env bash
# Smoke-test the packed tarball from a fresh consumer project, the way a real
# TypeScript 7 user installs it: npm (not pnpm), the official TS 6/7
# side-by-side aliases, the optional feature peers, and the README overrides
# stanza. Verifies the default config parses through the real oxlint binary
# (all jsPlugins load, including the estree-dependent ones), that the decent
# and typescript-compat rules actually fire, and that a clean file passes.
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
consumer_dir="$(mktemp -d)"
trap 'rm -rf "$consumer_dir"' EXIT

echo "==> Packing $repo_dir"
tarball="$repo_dir/$(cd "$repo_dir" && pnpm pack | tail -1)"
trap 'rm -rf "$consumer_dir" "$tarball"' EXIT

echo "==> Creating consumer project in $consumer_dir"
cd "$consumer_dir"
# The overrides stanza is the documented fix for eslint-plugin-react's eslint
# peer cap ($eslint is npm overrides syntax, not a shell variable).
cat > package.json << 'JSON'
{
  "name": "consumer-smoke-test",
  "private": true,
  "type": "module",
  "overrides": {
    "eslint-plugin-react": {
      "eslint": "$eslint"
    }
  }
}
JSON

if [[ "${1:-standalone}" == "vite-plus" ]]; then
  echo "==> Installing a Vite+ consumer without standalone oxlint or eslint"
  # A packed consumer catches auto-installed peers that the library's own
  # development dependencies hide. Vite+ must be the only source of oxlint.
  pnpm add --save-dev "$tarball" vite-plus@0.3.0 \
    "@typescript/native@npm:typescript@^7" \
    "typescript@npm:@typescript/typescript6@^6"

  cat > vite.config.ts << 'TS'
import { defineConfig } from 'vite-plus';
import { oxlintConfig } from 'oxlint-config-decent';

export default defineConfig({
  lint: oxlintConfig({ enableReact: false, enableVitest: false, enableTestingLibrary: false }),
});
TS

  echo "==> Vite+ configuration types must agree without a cast"
  pnpm exec tsc --noEmit --skipLibCheck --strict --module nodenext --target ES2023 vite.config.ts
  echo "==> Incremental Vite+ upgrade must keep configuration types compatible"
  pnpm add --save-dev vite-plus@0.3.1
  pnpm exec tsc --noEmit --skipLibCheck --strict --module nodenext --target ES2023 vite.config.ts
  lint_command=(pnpm exec vp lint)
else
  echo "==> Installing tarball + peers with npm"
  npm install --save-dev \
    "$tarball" \
    oxlint \
    oxlint-tsgolint \
    eslint \
    eslint-plugin-react \
    @vitest/eslint-plugin \
    eslint-plugin-testing-library \
    "@typescript/native@npm:typescript@^7" \
    "typescript@npm:@typescript/typescript6@^6"

  echo "==> Generating .oxlintrc.json from the default config"
  node --input-type=module -e "
import { writeFileSync } from 'node:fs';
import { oxlintConfig } from 'oxlint-config-decent';
writeFileSync('.oxlintrc.json', JSON.stringify(oxlintConfig(), null, 2));
"
  lint_command=(npx oxlint --config=.oxlintrc.json)
fi

mkdir src
cat > tsconfig.json << 'JSON'
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
JSON

cat > src/answer.ts << 'TS'
export const answer = 42;
TS

# decent/require-extension violation: relative import without an extension.
cat > src/bad.ts << 'TS'
import { answer } from './answer';

export const twice = answer * 2;
TS

# typescript-compat violations: member ordering and missing accessibility.
cat > src/probe.ts << 'TS'
export class LintProbe {
  private helper(): void {
    this.value += 1;
  }

  public constructor() {
    this.helper();
  }

  value = 1;
}
TS

echo "==> Clean file must pass"
"${lint_command[@]}" src/answer.ts

echo "==> Violations must be reported"
if "${lint_command[@]}" src/bad.ts src/probe.ts > lint-output.txt 2>&1; then
  echo "Expected oxlint to fail on the violation fixtures" >&2
  cat lint-output.txt >&2
  exit 1
fi

for expected in 'decent(require-extension)' 'typescript-compat(member-ordering)' 'typescript-compat(explicit-member-accessibility)'; do
  if ! grep -qF "$expected" lint-output.txt; then
    echo "Expected '$expected' in oxlint output" >&2
    cat lint-output.txt >&2
    exit 1
  fi
done

echo "==> Consumer smoke test passed"
