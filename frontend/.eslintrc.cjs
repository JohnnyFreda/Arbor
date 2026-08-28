/*
 * ESLint 8 uses eslintrc-style config, and package.json sets "type": "module",
 * so this file has to be .cjs to be loadable.
 *
 * Only plugins already in devDependencies are wired up here -- the lint script
 * has existed since the project started but no config did, so `npm run lint`
 * simply errored out. This makes it run rather than introducing a new stack.
 */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // A context module exports its provider and its hook together, which is
      // the idiomatic React shape. The rule objects because mixing them costs
      // fast refresh for that file -- a dev-time nicety not worth splitting
      // every context in two and threading an extra import through the app.
      files: ['src/context/**/*.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
}
