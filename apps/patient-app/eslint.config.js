// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");
const base = require("@doctor-connect/config/eslint-base.cjs");

module.exports = [
  ...expoConfig,
  base,
  {
    ignores: ["dist/*"],
  },
];
