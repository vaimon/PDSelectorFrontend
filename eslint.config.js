import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // The journey smoke runs in Node, not in the browser.
    files: ['smoke/**/*.{js,mjs}', 'playwright.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Two words, one meaning each (#26). team-selection said «капитан» and «отбор», core and the
    // backend now say «тимлид» and «набор», and the same students meet both within a month —
    // nobody selects anybody here, the teams assemble themselves.
    //
    // This is the guard instead of a strings module: it covers every string a person can read,
    // including the ones nobody would have moved into a module, and the smoke suite, which is
    // where wording is asserted — a green run against the old word is worse than no guard.
    // Internal names keep the backend's vocabulary: a selector matches text, not identifiers.
    // A literal that has to quote the backend verbatim takes an eslint-disable-next-line.
    files: ['src/**/*.{js,jsx}', 'smoke/**/*.{js,mjs}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...[
          ['капитан', 'Роль называется «тимлид»: «капитан» остаётся только во внутренних именах (isCaptain, captain_id) и в том, что присылает бэкенд. Строку, которая обязана цитировать бэкенд, закройте eslint-disable-next-line.'],
          ['отбор', 'Процесс называется «набор»: никто никого не отбирает, команды собираются сами. Строку, которая обязана цитировать бэкенд, закройте eslint-disable-next-line.'],
        ].flatMap(([word, message]) => [
          `Literal[value=/${word}/i]`,
          `TemplateElement[value.cooked=/${word}/i]`,
          `JSXText[value=/${word}/i]`,
        ].map((selector) => ({ selector, message }))),
      ],
    },
  },
]
