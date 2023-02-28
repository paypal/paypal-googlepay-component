/* @flow */

module.exports = {
  extends: "@krakenjs/eslint-config-grumbler/eslintrc-browser",

  globals: {
    __sdk__: true,
    document: true,
    performance: true,
    assert: true,
    beforeAll: true,
    afterAll: true,
    test: true,
    jest: true,
    page: true,
    browserlist: true,
  },
  overrides: [
    {
      files: ["**/*.test.js"],
      env: {
        jest: true,
      },
      globals: {
        JestMockFn: false,
      },
    },
  ],
  rules: {
    "compat/compat": "off",
    "max-lines": "off",
    "no-restricted-globals": "off",
    "promise/no-native": "off",
    "key-spacing": "off",
    "import/no-commonjs": "off",
  },
};
