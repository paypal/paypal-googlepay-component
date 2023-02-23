/* @flow */

import "../src/index"; // eslint-disable-line import/no-unassigned-import

describe("Error cases", () => {
  it("Should error out if buttonText is not passed to ExamplePay", () => {
    let error;

    try {
      window.paypal.ExamplePay.render({}, "body");
    } catch (err) {
      error = err;
    }

    if (!error) {
      throw new Error(`Expected ExamplePay.render call to throw an error`);
    }
  });
});
