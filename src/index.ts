import { type DummyRule, type ExternalPluginEntry, type OxlintConfig, type OxlintOverride } from 'oxlint';

export interface OxlintConfigOptions {
  enableReact?: boolean;
  enableVitest?: boolean;
  enableNextJs?: boolean;
  enableTestingLibrary?: boolean;
  /**
   * The typescript-compat, vitest-compat, and testing-library plugins import
   * `@typescript-eslint/typescript-estree`, which requires a JS-API TypeScript
   * (`<6.1`) to be resolvable at lint time. TypeScript 7 projects can keep
   * these plugins by aliasing `typescript` to `@typescript/typescript6`
   * (Microsoft's official side-by-side arrangement — see the README), or set
   * this to `false` to drop them instead.
   * @default true
   */
  enableTypeScriptEstreePlugins?: boolean;
  nextJsRootDir?: string;
  reactVersion?: string;
}

// Describe the config we generate instead of exporting every native rule's
// version-specific option type. Consumers may use a newer bundled oxlint.
export type DecentOxlintConfig = Omit<OxlintConfig, 'rules' | 'overrides' | 'extends'> & {
  extends?: DecentOxlintConfig[];
  rules?: Record<string, DummyRule>;
  overrides?: (Omit<OxlintOverride, 'rules' | 'extends'> & { extends?: DecentOxlintConfig[]; rules?: Record<string, DummyRule> })[];
};

// Matches ESLint vitest config: **/*.{spec,test}.ts?(x)
const VITEST_FILE_GLOBS = ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'];

// Matches ESLint testing-library + test TS relaxation config: **/*.{spec,test,tests}.ts?(x)
const TEST_FILE_GLOBS = [...VITEST_FILE_GLOBS, '**/*.tests.ts', '**/*.tests.tsx'];

const eslintBaseRules: Record<string, DummyRule> = {
  'eslint/array-callback-return': ['error', { allowImplicit: true }],
  'eslint/block-scoped-var': 'error',
  'eslint/default-case': ['error', { commentPattern: '^no default$' }],
  'eslint/default-case-last': 'error',
  'eslint/eqeqeq': ['error', 'smart'],
  'eslint/func-names': 'error',
  'eslint/func-style': ['error', 'declaration', { allowArrowFunctions: false }],
  'eslint/grouped-accessor-pairs': 'error',
  'eslint/guard-for-in': 'error',
  'eslint/id-length': ['error', { exceptions: ['_', '$', 'e', 'i', 'j', 'k', 'q', 't', 'x', 'y'] }],
  'eslint/max-classes-per-file': ['error', 1],
  'eslint/operator-assignment': ['error', 'always'],
  'eslint/no-await-in-loop': 'error',
  'eslint/no-bitwise': 'error',
  'eslint/no-caller': 'error',
  'eslint/no-cond-assign': ['error', 'always'],
  'eslint/no-console': 'error',
  'eslint/no-constructor-return': 'error',
  'eslint/no-else-return': ['error', { allowElseIf: false }],
  'eslint/no-empty-static-block': 'error',
  'eslint/no-eval': 'error',
  'eslint/no-extend-native': 'error',
  'eslint/no-extra-bind': 'error',
  'eslint/no-extra-label': 'error',
  'eslint/no-inner-declarations': 'error',
  'eslint/no-iterator': 'error',
  'eslint/no-label-var': 'error',
  'eslint/no-labels': ['error', { allowLoop: false, allowSwitch: false }],
  'eslint/no-lone-blocks': 'error',
  'eslint/no-lonely-if': 'error',
  'eslint/no-multi-assign': 'error',
  'eslint/no-multi-str': 'error',
  'eslint/no-negated-condition': 'error',
  'eslint/no-nested-ternary': 'error',
  'eslint/no-new-wrappers': 'error',
  'eslint/no-promise-executor-return': 'error',
  'eslint/no-proto': 'error',
  'eslint/no-restricted-globals': [
    'error',
    {
      name: 'isFinite',
      message: 'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
    },
    {
      name: 'isNaN',
      message: 'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
    },
  ],
  'eslint/no-return-assign': ['error', 'always'],
  'eslint/no-self-compare': 'error',
  'eslint/no-sequences': 'error',
  'eslint/no-script-url': 'error',
  'eslint/no-template-curly-in-string': 'error',
  'eslint/no-unneeded-ternary': ['error', { defaultAssignment: false }],
  'eslint/no-unused-expressions': ['error', { allowShortCircuit: false, allowTernary: false, allowTaggedTemplates: false }],
  'eslint/no-useless-computed-key': 'error',
  'eslint/no-useless-concat': 'error',
  'eslint/no-useless-rename': 'error',
  'eslint/no-useless-return': 'error',
  'eslint/prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
  'eslint/prefer-exponentiation-operator': 'off',
  'eslint/prefer-numeric-literals': 'error',
  'eslint/prefer-object-spread': 'error',
  'eslint/prefer-template': 'error',
  'eslint/sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true, allowSeparatedGroups: true }],
  'eslint/symbol-description': 'error',
  'eslint/unicode-bom': ['error', 'never'],
  'eslint/vars-on-top': 'error',
  'eslint/yoda': 'error',
  // Node rules (remapped from base eslint)
  'node/global-require': 'error',
  'node/no-new-require': 'error',
  'node/no-path-concat': 'error',
};

// CJS/ESM rules that also apply to TS files via typescript extensions
const eslintCjsEsmRules: Record<string, DummyRule> = {
  'eslint/curly': ['error', 'multi-line'],
  'eslint/getter-return': ['error', { allowImplicit: true }],
  'eslint/no-array-constructor': 'error',
  'eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
  'eslint/no-new-func': 'error',
  'eslint/no-shadow': 'error',
  'eslint/no-unexpected-multiline': 'error',
  'eslint/no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
  'eslint/no-useless-constructor': 'error',
  'eslint/no-var': 'error',
  'eslint/prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
};

// Gap core ESLint rules not yet natively supported — covered via eslint-compat JS plugin (oxlint-plugin-eslint)
const eslintCompatRules: Record<string, DummyRule> = {
  'eslint-compat/object-shorthand': ['error', 'always', { ignoreConstructors: false, avoidQuotes: true, avoidExplicitReturnArrows: true }],
  'eslint-compat/one-var': ['error', 'never'],
  'eslint-compat/no-octal-escape': 'error',
  'eslint-compat/no-restricted-exports': ['error', { restrictedNamedExports: ['default', 'then'] }],
  'eslint-compat/no-restricted-properties': [
    'error',
    { object: 'arguments', property: 'callee', message: 'arguments.callee is deprecated' },
    { property: '__defineGetter__', message: 'Please use Object.defineProperty instead.' },
    { property: '__defineSetter__', message: 'Please use Object.defineProperty instead.' },
  ],
  'eslint-compat/no-restricted-syntax': ['error', 'DebuggerStatement', 'LabeledStatement', 'WithStatement'],
  'eslint-compat/no-undef-init': 'error',
  'eslint-compat/no-unreachable-loop': ['error', { ignore: [] }],
  'eslint-compat/prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
};

const typescriptRules: Record<string, DummyRule> = {
  // Disable base ESLint rules that TS extends
  'eslint/no-loss-of-precision': 'off',
  'eslint/no-unused-expressions': 'off',

  'typescript/array-type': ['error', { default: 'array' }],
  'typescript/await-thenable': 'error',
  'typescript/ban-ts-comment': ['error', { minimumDescriptionLength: 10, 'ts-expect-error': { descriptionFormat: '^ - [^ ].*$' } }],
  'typescript/ban-tslint-comment': 'error',
  'typescript/class-literal-property-style': 'error',
  'typescript/consistent-generic-constructors': 'error',
  'typescript/consistent-indexed-object-style': 'error',
  'typescript/consistent-type-assertions': 'error',
  'typescript/consistent-type-definitions': 'error',
  'typescript/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
  'typescript/default-param-last': 'error',
  'typescript/dot-notation': 'error',
  'typescript/explicit-function-return-type': 'off',
  'typescript/no-array-delete': 'error',
  'typescript/no-base-to-string': 'error',
  'typescript/no-confusing-non-null-assertion': 'error',
  'typescript/no-confusing-void-expression': 'error',
  'typescript/no-deprecated': 'off',
  'typescript/no-dupe-class-members': 'error',
  'typescript/no-duplicate-enum-values': 'error',
  'typescript/no-duplicate-type-constituents': 'error',
  'typescript/no-dynamic-delete': 'error',
  'typescript/no-empty-interface': 'error',
  'typescript/no-empty-object-type': 'error',
  'typescript/no-explicit-any': 'error',
  'typescript/no-extra-non-null-assertion': 'error',
  'typescript/no-extraneous-class': 'error',
  'typescript/no-floating-promises': 'error',
  'typescript/no-for-in-array': 'error',
  'typescript/no-implied-eval': 'error',
  'typescript/no-inferrable-types': 'error',
  'typescript/no-invalid-void-type': 'error',
  'typescript/no-loop-func': 'error',
  'typescript/no-meaningless-void-operator': 'error',
  'typescript/no-misused-new': 'error',
  'typescript/no-misused-promises': 'error',
  'typescript/no-mixed-enums': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'typescript/no-non-null-asserted-optional-chain': 'error',
  'typescript/no-non-null-assertion': 'error',
  'typescript/no-redeclare': 'error',
  'typescript/no-redundant-type-constituents': 'error',
  'typescript/no-require-imports': 'error',
  'typescript/no-shadow': 'error',
  'typescript/no-this-alias': 'error',
  'typescript/no-unnecessary-boolean-literal-compare': 'error',
  'typescript/no-unnecessary-condition': 'error',
  'typescript/no-unnecessary-template-expression': 'error',
  'typescript/no-unnecessary-type-arguments': 'error',
  'typescript/no-unnecessary-type-assertion': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unnecessary-type-parameters': 'error',
  'typescript/no-unsafe-argument': 'error',
  'typescript/no-unsafe-assignment': 'error',
  'typescript/no-unsafe-call': 'error',
  'typescript/no-unsafe-declaration-merging': 'error',
  'typescript/no-unsafe-enum-comparison': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'typescript/no-unsafe-member-access': 'error',
  'typescript/no-unsafe-return': 'error',
  'typescript/no-unsafe-unary-minus': 'error',
  'typescript/no-useless-empty-export': 'error',
  'typescript/no-wrapper-object-types': 'error',
  'typescript/non-nullable-type-assertion-style': 'error',
  'typescript/only-throw-error': 'error',
  'typescript/parameter-properties': ['error', { allow: ['readonly'] }],
  'typescript/prefer-as-const': 'error',
  'typescript/prefer-find': 'error',
  'typescript/prefer-for-of': 'error',
  'typescript/prefer-function-type': 'error',
  'typescript/prefer-includes': 'error',
  'typescript/prefer-literal-enum-member': 'error',
  'typescript/prefer-namespace-keyword': 'error',
  'typescript/prefer-nullish-coalescing': 'error',
  'typescript/prefer-optional-chain': 'error',
  'typescript/prefer-promise-reject-errors': 'error',
  'typescript/prefer-reduce-type-parameter': 'error',
  'typescript/prefer-regexp-exec': 'error',
  'typescript/prefer-return-this-type': 'error',
  'typescript/prefer-string-starts-ends-with': 'error',
  'typescript/prefer-ts-expect-error': 'error',
  'typescript/require-await': 'error',
  'typescript/restrict-plus-operands': 'error',
  'typescript/restrict-template-expressions': ['error', { allowNumber: true }],
  'typescript/return-await': 'error',
  'typescript/switch-exhaustiveness-check': 'error',
  'typescript/triple-slash-reference': 'error',
  'typescript/unbound-method': 'error',
  'typescript/unified-signatures': 'error',
  'typescript/use-unknown-in-catch-callback-variable': 'off',
};

// Gap rules not yet natively supported — covered via typescript-compat JS plugin (@typescript-eslint/eslint-plugin)
const typescriptCompatRules: Record<string, DummyRule> = {
  'typescript-compat/explicit-member-accessibility': 'error',
  'typescript-compat/member-ordering': [
    'error',
    {
      default: [
        'signature',
        'private-field',
        'public-field',
        'protected-field',
        'public-constructor',
        'protected-constructor',
        'private-constructor',
        'public-method',
        'protected-method',
        'private-method',
      ],
    },
  ],
};

const importRules: Record<string, DummyRule> = {
  'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
  'import/first': 'error',
  'import/no-duplicates': 'error',
};

const unicornRules: Record<string, DummyRule> = {
  'unicorn/no-array-method-this-argument': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-object-from-entries': 'error',
  'unicorn/prefer-set-has': 'error',
};

// Gap rules not yet natively supported — covered via unicorn-compat JS plugin
const unicornCompatRules: Record<string, DummyRule> = {
  'unicorn-compat/better-regex': 'error',
  'unicorn-compat/custom-error-definition': 'error',
  'unicorn-compat/no-for-loop': 'error',
};

const promiseRules: Record<string, DummyRule> = {
  'promise/always-return': 'error',
  'promise/catch-or-return': ['error', { allowThen: true }],
  'promise/param-names': 'error',
};

const jsdocRules: Record<string, DummyRule> = {
  // Explicitly configured
  'jsdoc/check-tag-names': 'error',
  // enableFixer and unnamedRootBase belong to eslint-plugin-jsdoc; native
  // oxlint rejects them instead of silently ignoring unsupported options.
  'jsdoc/require-param': ['error', { ignoreWhenAllParamsMissing: true }],
  'jsdoc/require-param-description': 'off',
  'jsdoc/require-param-name': 'error',
  'jsdoc/require-param-type': 'error',
  'jsdoc/require-returns-description': 'off',
  'jsdoc/require-returns-type': 'off',

  // From flat/recommended inheritance
  'jsdoc/check-access': 'error',
  'jsdoc/check-property-names': 'error',
  'jsdoc/empty-tags': 'error',
  'jsdoc/implements-on-classes': 'error',
  'jsdoc/no-defaults': 'error',
  'jsdoc/require-property': 'error',
  'jsdoc/require-property-description': 'error',
  'jsdoc/require-property-name': 'error',
  'jsdoc/require-property-type': 'error',
  'jsdoc/require-returns': 'error',
  'jsdoc/require-yields': 'error',
};

// Gap rules not yet natively supported — covered via jsdoc-compat JS plugin
const jsdocCompatRules: Record<string, DummyRule> = {
  'jsdoc-compat/check-alignment': 'error',
  'jsdoc-compat/check-indentation': 'error',
  'jsdoc-compat/check-types': 'error',
  'jsdoc-compat/require-hyphen-before-param-description': 'error',
  'jsdoc-compat/require-returns-check': 'error',
  'jsdoc-compat/require-yields-check': 'error',
  'jsdoc-compat/tag-lines': 'error',
  'jsdoc-compat/valid-types': 'error',
};

// Most stylistic rules are formatting-only (handled by oxfmt/Prettier). The one structural
// rule that formatters don't handle is padding-line-between-statements.
const stylisticCompatRules: Record<string, DummyRule> = {
  'stylistic-compat/padding-line-between-statements': [
    'error',
    {
      blankLine: 'always',
      prev: ['directive', 'block', 'block-like', 'multiline-block-like', 'cjs-export', 'cjs-import', 'class', 'export', 'import', 'if'],
      next: '*',
    },
    {
      blankLine: 'never',
      prev: 'directive',
      next: 'directive',
    },
    {
      blankLine: 'any',
      prev: '*',
      next: ['if', 'for', 'cjs-import', 'import'],
    },
    {
      blankLine: 'any',
      prev: ['export', 'import'],
      next: ['export', 'import'],
    },
    {
      blankLine: 'always',
      prev: '*',
      next: ['try', 'function', 'switch'],
    },
    {
      blankLine: 'always',
      prev: 'if',
      next: 'if',
    },
    {
      blankLine: 'never',
      prev: ['return', 'throw'],
      next: '*',
    },
  ],
};

const securityRules: Record<string, DummyRule> = {
  'security/detect-buffer-noassert': 'error',
  'security/detect-child-process': 'error',
  'security/detect-disable-mustache-escape': 'error',
  'security/detect-eval-with-expression': 'error',
  'security/detect-new-buffer': 'error',
  'security/detect-no-csrf-before-method-override': 'error',
  'security/detect-non-literal-fs-filename': 'error',
  'security/detect-non-literal-regexp': 'error',
  'security/detect-non-literal-require': 'error',
  'security/detect-object-injection': 'off',
  'security/detect-possible-timing-attacks': 'error',
  'security/detect-pseudoRandomBytes': 'error',
  'security/detect-unsafe-regex': 'error',
};

const reactRules: Record<string, DummyRule> = {
  // From react.configs.recommended
  'react/jsx-key': 'error',
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/no-children-prop': 'error',
  'react/no-find-dom-node': 'error',
  'react/no-render-return-value': 'error',
  'react/no-string-refs': 'error',
  'react/no-unescaped-entities': 'error',
  'react/no-unknown-property': 'error',

  // Explicitly configured rules with native oxlint equivalents
  'react/display-name': ['error', { ignoreTranspilerName: false }],
  'react/iframe-missing-sandbox': 'warn',
  'react/jsx-fragments': 'error',
  'react/jsx-no-script-url': 'error',
  'react/jsx-no-target-blank': 'error',
  'react/jsx-no-undef': 'error',
  'react/jsx-no-useless-fragment': 'error',
  'react/jsx-pascal-case': ['error', { allowAllCaps: true, ignore: [] }],
  'react/no-danger-with-children': 'error',
  'react/no-did-mount-set-state': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-namespace': 'error',
  'react/no-redundant-should-component-update': 'error',
  'react/no-this-in-sfc': 'error',
  'react/no-unsafe': 'error',
  'react/no-will-update-set-state': 'error',
  'react/require-render-return': 'error',
  'react/self-closing-comp': 'error',
  'react/style-prop-object': 'error',

  // React hooks (prefix changes from react-hooks/ to react/ in oxlint)
  'react/rules-of-hooks': 'error',
  'react/exhaustive-deps': 'error',
};

// Gap rules not yet natively supported — covered via react-compat JS plugin
const reactCompatRules: Record<string, DummyRule> = {
  'react-compat/default-props-match-prop-types': 'error',
  'react-compat/forbid-foreign-prop-types': ['error', { allowInPropTypes: true }],
  'react-compat/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }],
  'react-compat/no-access-state-in-setstate': 'error',
  'react-compat/no-arrow-function-lifecycle': 'error',
  'react-compat/no-deprecated': 'error',
  'react-compat/no-did-update-set-state': 'error',
  'react-compat/no-invalid-html-attribute': 'error',
  'react-compat/no-typos': 'error',
  'react-compat/no-unstable-nested-components': 'error',
  'react-compat/no-unused-class-component-methods': 'error',
  'react-compat/no-unused-prop-types': 'error',
  'react-compat/no-unused-state': 'error',
  'react-compat/prefer-stateless-function': 'error',
  // Formatting rules excluded: jsx-closing-bracket-location, jsx-props-no-multi-spaces
};

const jsxA11yRules: Record<string, DummyRule> = {
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/anchor-has-content': 'error',
  'jsx-a11y/anchor-is-valid': 'error',
  'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
  'jsx-a11y/aria-unsupported-elements': 'error',
  'jsx-a11y/autocomplete-valid': 'error',
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/heading-has-content': 'error',
  'jsx-a11y/html-has-lang': 'error',
  'jsx-a11y/iframe-has-title': 'error',
  'jsx-a11y/img-redundant-alt': 'error',
  'jsx-a11y/label-has-associated-control': 'error',
  'jsx-a11y/lang': 'error',
  'jsx-a11y/media-has-caption': 'error',
  'jsx-a11y/mouse-events-have-key-events': 'error',
  'jsx-a11y/no-access-key': 'error',
  'jsx-a11y/no-aria-hidden-on-focusable': 'error',
  'jsx-a11y/no-autofocus': 'error',
  'jsx-a11y/no-distracting-elements': 'error',
  'jsx-a11y/no-noninteractive-tabindex': 'error',
  'jsx-a11y/no-redundant-roles': 'error',
  'jsx-a11y/no-static-element-interactions': 'error',
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/role-supports-aria-props': 'error',
  'jsx-a11y/scope': 'error',
  'jsx-a11y/tabindex-no-positive': 'error',
};

const nextjsRules: Record<string, DummyRule> = {
  'nextjs/google-font-display': 'error',
  'nextjs/google-font-preconnect': 'error',
  'nextjs/inline-script-id': 'error',
  'nextjs/next-script-for-ga': 'error',
  'nextjs/no-assign-module-variable': 'error',
  'nextjs/no-async-client-component': 'error',
  'nextjs/no-before-interactive-script-outside-document': 'error',
  'nextjs/no-css-tags': 'error',
  'nextjs/no-document-import-in-page': 'error',
  'nextjs/no-duplicate-head': 'error',
  'nextjs/no-head-element': 'error',
  'nextjs/no-head-import-in-document': 'error',
  'nextjs/no-html-link-for-pages': 'error',
  'nextjs/no-img-element': 'error',
  'nextjs/no-page-custom-font': 'error',
  'nextjs/no-script-component-in-head': 'error',
  'nextjs/no-styled-jsx-in-document': 'error',
  'nextjs/no-sync-scripts': 'error',
  'nextjs/no-title-in-document-head': 'error',
  'nextjs/no-typos': 'error',
  'nextjs/no-unwanted-polyfillio': 'error',
};

const vitestRules: Record<string, DummyRule> = {
  // From vitest.configs.recommended
  'vitest/expect-expect': 'error',
  'vitest/no-identical-title': 'error',
  'vitest/no-commented-out-tests': 'error',
  'vitest/valid-title': 'error',
  'vitest/valid-expect': 'error',
  'vitest/valid-describe-callback': 'error',
  'vitest/no-import-node-test': 'error',

  // Explicitly configured
  'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
  'vitest/no-conditional-tests': 'error',
  'vitest/no-disabled-tests': 'error',
  'vitest/no-duplicate-hooks': 'error',
  'vitest/no-focused-tests': 'error',
  'vitest/no-standalone-expect': 'error',
  'vitest/no-test-prefixes': 'error',
  'vitest/prefer-comparison-matcher': 'error',
  'vitest/prefer-equality-matcher': 'error',
  'vitest/prefer-hooks-in-order': 'error',
  'vitest/prefer-hooks-on-top': 'error',
  'vitest/prefer-lowercase-title': ['error', { ignore: ['describe'] }],
  'vitest/prefer-mock-promise-shorthand': 'error',
  'vitest/prefer-spy-on': 'error',
  'vitest/prefer-strict-equal': 'error',
  'vitest/require-to-throw-message': 'error',
  'vitest/require-top-level-describe': 'error',
};

// Gap rules not yet natively supported — covered via vitest-compat JS plugin
const vitestCompatRules: Record<string, DummyRule> = {
  'vitest-compat/padding-around-after-all-blocks': 'error',
  'vitest-compat/padding-around-after-each-blocks': 'error',
  'vitest-compat/padding-around-describe-blocks': 'error',
  'vitest-compat/prefer-snapshot-hint': 'error',
  'vitest-compat/prefer-vi-mocked': 'error',
};

// From testingLibrary.configs['flat/react'].rules + overrides
const testingLibraryRules: Record<string, DummyRule> = {
  'testing-library/await-async-events': ['error', { eventModule: 'userEvent' }],
  'testing-library/await-async-queries': 'error',
  'testing-library/await-async-utils': 'error',
  'testing-library/no-await-sync-events': ['error', { eventModules: ['fire-event'] }],
  'testing-library/no-await-sync-queries': 'error',
  'testing-library/no-container': 'error',
  'testing-library/no-debugging-utils': 'error',
  'testing-library/no-dom-import': ['error', 'react'],
  'testing-library/no-global-regexp-flag-in-query': 'error',
  'testing-library/no-manual-cleanup': 'error',
  'testing-library/no-node-access': 'error',
  'testing-library/no-promise-in-fire-event': 'error',
  'testing-library/no-render-in-lifecycle': 'error',
  'testing-library/no-unnecessary-act': 'error',
  'testing-library/no-wait-for-multiple-assertions': 'error',
  'testing-library/no-wait-for-side-effects': 'error',
  'testing-library/no-wait-for-snapshot': 'error',
  'testing-library/prefer-explicit-assert': 'warn',
  'testing-library/prefer-find-by': 'error',
  'testing-library/prefer-implicit-assert': 'error',
  'testing-library/prefer-presence-queries': 'error',
  'testing-library/prefer-query-by-disappearance': 'error',
  'testing-library/prefer-query-matchers': 'off',
  'testing-library/prefer-screen-queries': 'error',
  'testing-library/render-result-naming-convention': 'error',
};

export function oxlintConfig(options?: OxlintConfigOptions): DecentOxlintConfig {
  const enableReact = options?.enableReact ?? true;
  const enableVitest = options?.enableVitest ?? true;
  const enableNextJs = options?.enableNextJs ?? false;
  const enableTsEstree = options?.enableTypeScriptEstreePlugins ?? true;
  // eslint-plugin-testing-library imports @typescript-eslint/utils, so it
  // cannot load when the estree-dependent plugins are disabled.
  const enableTestingLibrary = (options?.enableTestingLibrary ?? true) && enableTsEstree;

  const plugins: OxlintConfig['plugins'] = [
    'eslint',
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'promise',
    'jsdoc',
    'node',
    ...(enableReact ? (['react', 'jsx-a11y'] as const) : []),
    ...(enableNextJs ? (['nextjs'] as const) : []),
    ...(enableVitest ? (['vitest'] as const) : []),
  ];

  const jsPlugins: ExternalPluginEntry[] = [
    // This package's own rules (require-extension, require-index)
    { name: 'decent', specifier: 'oxlint-config-decent/plugin' },
    // Standalone JS plugins (no native equivalents)
    'eslint-plugin-security',
    // -compat JS plugins for gap rules in partially-supported native plugins
    { name: 'eslint-compat', specifier: 'oxlint-plugin-eslint' },
    { name: 'unicorn-compat', specifier: 'eslint-plugin-unicorn' },
    { name: 'jsdoc-compat', specifier: 'eslint-plugin-jsdoc' },
    { name: 'stylistic-compat', specifier: '@stylistic/eslint-plugin' },
    ...(enableTsEstree ? [{ name: 'typescript-compat', specifier: '@typescript-eslint/eslint-plugin' }] : []),
    ...(enableReact ? [{ name: 'react-compat', specifier: 'eslint-plugin-react' }] : []),
    ...(enableVitest && enableTsEstree ? [{ name: 'vitest-compat', specifier: '@vitest/eslint-plugin' }] : []),
    ...(enableTestingLibrary ? ['eslint-plugin-testing-library'] : []),
  ];

  const settings: Record<string, unknown> = {
    ...(enableReact ? { react: { version: options?.reactVersion ?? '19' } } : {}),
    ...(enableNextJs && options?.nextJsRootDir ? { next: { rootDir: options.nextJsRootDir } } : {}),
  };

  const rules: Record<string, DummyRule> = {
    'decent/require-extension': 'error',
    'decent/require-index': 'error',
    ...eslintBaseRules,
    ...eslintCjsEsmRules,
    ...eslintCompatRules,
    ...typescriptRules,
    ...importRules,
    ...unicornRules,
    ...unicornCompatRules,
    ...promiseRules,
    ...jsdocRules,
    ...jsdocCompatRules,
    ...stylisticCompatRules,
    ...securityRules,
    ...(enableReact ? { ...reactRules, ...reactCompatRules, ...jsxA11yRules } : {}),
    ...(enableNextJs ? nextjsRules : {}),
  };

  const overrides: NonNullable<DecentOxlintConfig['overrides']> = [
    ...(enableTsEstree
      ? [
          {
            files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
            rules: typescriptCompatRules,
          },
        ]
      : []),
    ...(enableReact
      ? [
          {
            files: ['**/*.tsx'],
            rules: { 'typescript/explicit-function-return-type': 'off' as const },
          },
          {
            files: ['**/components/**/*.tsx'],
            rules: {
              'import/no-default-export': 'error' as const,
              'unicorn/filename-case': ['error', { case: 'pascalCase' }] as DummyRule,
            },
          },
        ]
      : []),
    ...(enableVitest
      ? [
          {
            files: VITEST_FILE_GLOBS,
            rules: { ...vitestRules, ...(enableTsEstree ? vitestCompatRules : {}) },
          },
        ]
      : []),
    ...(enableTestingLibrary
      ? [
          {
            files: TEST_FILE_GLOBS,
            jsPlugins: ['eslint-plugin-testing-library'] as ExternalPluginEntry[],
            rules: testingLibraryRules,
          },
        ]
      : []),
    ...(enableVitest || enableTestingLibrary
      ? [
          {
            files: TEST_FILE_GLOBS,
            rules: {
              'typescript/explicit-function-return-type': 'off' as const,
              'typescript/no-confusing-void-expression': 'off' as const,
              'typescript/no-non-null-assertion': 'off' as const,
              'typescript/no-unsafe-member-access': 'off' as const,
            },
          },
        ]
      : []),
  ];

  return {
    plugins,
    jsPlugins,
    rules,
    options: { typeAware: true },
    ...(Object.keys(settings).length > 0 ? { settings } : {}),
    ...(overrides.length > 0 ? { overrides } : {}),
    ignorePatterns: ['**/dist/**', '**/node_modules/**'],
    env: { node: true, es6: true },
  };
}
