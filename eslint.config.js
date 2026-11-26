// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['node_modules/', 'lib/', 'dist/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // 约定：以 `_` 起头的形参是刻意不用的占位（如测试桩里对齐真实签名却不消费的 `_signal`）。
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
)
