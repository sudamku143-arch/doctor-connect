// Shared rule set layered on top of each app's own framework ESLint config
// (eslint-config-expo for the RN apps, eslint-config-next for the admin panel).
// Kept framework-agnostic on purpose so it composes with either.
module.exports = {
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
