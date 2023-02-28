/* @flow */

import "../src/index"; // eslint-disable-line import/no-unassigned-import

describe("Happy cases", () => {
  it("Should create an instance of the client and render ExamplePay", () => {
    const body = document.body;
    if (!body) {
      throw new Error(`Expected document.body to be present`);
    }

    const container = document.createElement("div");
    container.id = "example-pay-container";
    body.appendChild(container);

    window.paypal.ExamplePay.render(
      {
        buttonText: "Pay Now",
      },
      "#example-pay-container"
    );

    const button = container.querySelector("button");
    if (!button) {
      throw new Error(`Expected button to be rendered`);
    }

    if (!button.textContent) {
      throw new Error(`Expected button to have text`);
    }

    if (button.textContent !== "Pay Now") {
      throw new Error(
        `Expected button text to be "Pay Now", got "${button.textContent.toString()}"`
      );
    }

    body.removeChild(container);
  });
});
