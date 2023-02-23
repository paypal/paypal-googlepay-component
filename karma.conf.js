/* @flow */
/* eslint import/no-default-export: off */

import { getKarmaConfig } from "@krakenjs/karma-config-grumbler";
import { getWebpackConfig } from "@krakenjs/webpack-config-grumbler";

import type { ExamplePayGlobalType } from "./src/types";

const examplePayGlobal: ExamplePayGlobalType = {
  serverConfig: {
    assetsUrl: "https://paypal.com/assets/",
  },
};

export default (karma: Object) => {
  const karmaConfig = getKarmaConfig(karma, {
    basePath: __dirname,
    webpack: getWebpackConfig({
      vars: {
        __example_pay__: examplePayGlobal,

        __PORT__: 8000,
        __SDK_HOST__: "test.paypal.com",
        __STAGE_HOST__: "msmaster.qa.paypal.com",
        __HOST__: "test.paypal.com",
        __HOSTNAME__: "test.paypal.com",
        __PATH__: "/sdk/js",
        __VERSION__: "1.0.55",
        __NAMESPACE__: "testpaypal",
      },
    }),
  });

  karma.set({
    ...karmaConfig,

    files: [
      {
        pattern: "test/paypal.js",
        included: true,
        served: true,
      },

      ...karmaConfig.files,
    ],
  });
};
