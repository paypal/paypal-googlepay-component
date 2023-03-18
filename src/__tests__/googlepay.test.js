/* eslint-disable eslint-comments/disable-enable-pair */
/* @flow */

import fetch from "isomorphic-fetch";

import { GooglePay } from "../component";

jest.mock("@paypal/sdk-client/src", () => ({
  getPartnerAttributionID: () => "bn_code",
  getClientID: () =>
    "B_AMvrD5p50dtQXhxF2gaQYxM3zxsQP6RVTLfx1JN5aGgPSDy1zR-EonK0ED3DZlxfyi28odj2IR1pnJBk",
  getMerchantID: () => ["6JTQHLV4QH9TJ"],
  getPayPalAPIDomain: () => "https://api.te-gpay-api-e2e.qa.paypal.com",
  getPayPalDomain: () => "https://www.te-gpay-api-e2e.qa.paypal.com",
  getBuyerCountry: () => "US",
  getLogger: () => ({
    info: () => ({
      track: () => ({
        flush: () => ({}),
      }),
    }),
    error: () => ({
      track: () => ({
        flush: () => ({}),
      }),
    }),
  }),
  getSDKQueryParam: (param) => {
    if (param === "currency") {
      return "USD";
    }

    return "";
  },
}));

jest.mock("../util", () => {
  return {
    getMerchantDomain: () => "https://www.checkout.com",
  };
});

jest.mock("@paypal/sdk-constants/src", () => {
  const originalModule = jest.requireActual("@paypal/sdk-constants/src");

  return {
    __esModule: true,
    ...originalModule,
  };
});

global.fetch = fetch;

describe("googlepay", () => {
  describe("Order", () => {
    it("Creates Order", async () => {
      const googlepay = GooglePay();

      const { id, status } = await googlepay.createOrder({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "1.00",
            },
            payee: {
              merchant_id: "6JTQHLV4QH9TJ",
            },
          },
        ],
      });

      expect(id).toBeTruthy();
      expect(status).toBe("CREATED");
    });
  });

  describe("Config", () => {
    it("GetGooglePayConfig", async () => {
      const googlepay = GooglePay();
      const config = await googlepay.config();
      expect(config).toEqual({
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "DISCOVER", "VISA", "AMEX"],
              billingAddressRequired: true,
              assuranceDetailsRequired: true,
              billingAddressParameters: {
                format: "FULL",
              },
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "paypalqa",
                gatewayMerchantId: "6JTQHLV4QH9TJ",
              },
            },
          },
        ],
        merchantInfo: {
          merchantOrigin: "https://www.checkout.com",
          merchantId: "BCR2DN4TXSDMVTKM",
        },
      });
    });
  });
});
