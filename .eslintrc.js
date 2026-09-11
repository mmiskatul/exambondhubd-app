// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  // 'prettier' last so it can switch off any formatting-related rule the
  // expo/eslint-plugin-react-native configs turn on — Prettier owns style,
  // ESLint owns correctness, so the two never disagree with each other.
  extends: ['expo', 'prettier'],
  overrides: [
    {
      // Build tooling runs under plain Node, not the app's own React
      // Native/browser-ish environment — without this, __dirname (and any
      // other Node global) reads as undefined to the linter here.
      files: ['metro.config.js', 'babel.config.js', 'tailwind.config.js'],
      env: { node: true },
    },
    {
      // jest.setup.js and *.test.ts(x) run under Jest, so the `jest` global
      // (jest.mock, jest.fn, ...) needs to be recognized here too.
      files: ['jest.setup.js', '**/*.test.ts', '**/*.test.tsx'],
      env: { jest: true },
    },
  ],
};
