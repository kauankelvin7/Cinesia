import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        // Vite defines process.env at build time
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '18.2' },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      // Regras clássicas do react-hooks (v4 era só estas 2)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Alertar componentes exportados que não são compatíveis com Fast Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Variáveis não utilizadas (ignorar args com _ no início)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Evitar console.log em produção (warn/error permitidos)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Props não validadas são aceitas (projeto usa JSX sem PropTypes)
      'react/prop-types': 'off',
      // Não exige React no scope com o novo JSX transform
      'react/react-in-jsx-scope': 'off',
      // Entidades não escapadas são aceitas em JSX (estilo)
      'react/no-unescaped-entities': 'warn',
      // Escapes desnecessários são avisos
      'no-useless-escape': 'warn',
      // React Three Fiber usa props customizadas (geometry, position, etc.)
      'react/no-unknown-property': 'off',
      // Expressão constante em binário — aviso
      'no-constant-binary-expression': 'warn',
    },
  },
];
