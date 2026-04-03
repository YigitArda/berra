module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/'],
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      env: { browser: true, node: false },
    },
  ],
};
