/** @type {import('eslint').Linter.Config} */
const ERROR = 2;

module.exports = {
  extends: ['@remix-run/eslint-config', '@remix-run/eslint-config/node'],
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  rules: {
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
