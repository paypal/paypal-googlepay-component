/* @flow */
/* eslint import/no-commonjs: 0 */

const globals = require("./globals");

module.exports = {
  googlepay: {
    entry: "./src/index",
    ...globals,
  },
};
