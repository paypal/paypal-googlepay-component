/* eslint-disable eslint-comments/disable-enable-pair */
/* @flow */

import fetch from "isomorphic-fetch";

import { Googlepay } from "../component";

jest.mock("@paypal/sdk-client/src", () => ({
  getPartnerAttributionID: () => "bn_code",
  getClientID: () =>
    "ARRXqmcYWf0Ekx1vXM_1nhs1eGSi9X_cVl6qjFb0PfTPsbhmErPrAFy4Y59kAKtG_HMzh7fcyvUVKUhO",
  getMerchantID: () => ["WSHE4HLKU3W5N"],
  getPayPalAPIDomain: () => "https://cors.api.sandbox.paypal.com",
  getPayPalDomain: () => "https://www.sandbox.paypal.com",
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
  getEnv: () => "stage",
}));

jest.mock("../util", () => {
  const actualUtil = jest.requireActual("../util");
  return {
    ...actualUtil,
    getMerchantDomain: () => "https://www.checkout.com",
    getPayPalDomain: () => "https://www.sandbox.paypal.com",
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
  describe("Config", () => {
    it("GetGooglePayConfig", async () => {
      const googlepay = Googlepay();
      const config = await googlepay.config();
      expect(config).toEqual({
        isEligible: true,
        apiVersion: 2,
        apiVersionMinor: 0,
        countryCode: "US",
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
                gateway: "paypalsb",
                gatewayMerchantId: "NDFBEMLJX9XMN",
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
