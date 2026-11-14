import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  { ignores: ['dist', 'coverage', 'public'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/no-v-html': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  skipFormatting,
)
