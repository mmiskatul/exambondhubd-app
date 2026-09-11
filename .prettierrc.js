// https://prettier.io/docs/en/configuration.html
// Matches the style already used throughout this codebase — this doesn't
// reformat anything on its own, it just gives `npm run format` and editors
// a single source of truth instead of everyone's own defaults.
module.exports = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
};
