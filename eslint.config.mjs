import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'out/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules
  },
  {
    files: [
      'src/main/**/*.ts',
      'src/preload/**/*.ts',
      '*.config.{ts,mts,mjs}',
      'scripts/**/*.mjs',
      'e2e/**/*.ts',
      'docs/.screenshots/**/*.ts',
      'docs/.vitepress/config.mts'
    ],
    languageOptions: { globals: globals.node }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true }
      ]
    }
  },
  prettier
)
