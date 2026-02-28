/** @type {import('eslint').Linter.Config} */
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    quotes: [ERROR, 'single', { avoidEscape: true }],
    semi: [ERROR, 'always'],
    'import/no-duplicates': ERROR,
    'import/order': [
      ERROR,
      {
        'newlines-between': 'always',
        groups: ['type', 'builtin', 'external', ['parent', 'sibling'], 'index'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
