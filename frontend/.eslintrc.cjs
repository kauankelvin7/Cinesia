module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  settings: {
    react: { version: '18.2' }
  },
  plugins: ['react-refresh'],
  rules: {
    // Alertar componentes exportados que não são compatíveis com Fast Refresh
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Variáveis não utilizadas (ignorar args com _ no início)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Evitar console.log em produção (warn/error permitidos)
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // React Hooks — dependências corretas
    'react-hooks/exhaustive-deps': 'warn',
    // Props não validadas são aceitas (projeto usa JSX sem PropTypes)
    'react/prop-types': 'off',
    // Não exige React no scope com o novo JSX transform
    'react/react-in-jsx-scope': 'off',
  },
};
