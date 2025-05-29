module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    project: './tsconfig.json', // Important for type-aware linting rules
  },
  env: {
    node: true, // Enables Node.js global variables and Node.js scoping.
    es6: true,
    jest: true, // Add Jest global variables
  },
  rules: {
    'prettier/prettier': 'error',
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.ts', '**/*.spec.ts', '**/jest.config.js', '**/setupTests.ts'] }],
    'import/prefer-default-export': 'off',
    'no-console': 'warn',
    'no-shadow': 'off', // Replaced by @typescript-eslint/no-shadow
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off', // Optional: enforce return types
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'class-methods-use-this': 'off', // Can be restrictive for service classes
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    // Add any other project-specific rules here
  },
  settings: {
    'import/resolver': {
      typescript: {}, // This loads <rootdir>/tsconfig.json to find SASS files
    },
  },
};
