/* eslint-disable eslint-comments/disable-enable-pair */
/* @flow */

import fetch from "isomorphic-fetch";

import { Googlepay } from "../component";

jest.mock("@paypal/sdk-client/src", () => ({
  getPartnerAttributionID: () => "bn_code",
  getClientID: () =>
    "B_AujOcb-yWAUxmdFwc_gFQC9i713jl3K-DxMvVXo06mCivoy06QycJkoxtEMwuR_H7OASqTNDPdF5by9M",
  getMerchantID: () => [],
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
  getEnv: () => "stage",
}));

jest.mock("../util", () => {
  const actualUtil = jest.requireActual("../util");
  return {
    ...actualUtil,
    getMerchantDomain: () => "https://www.checkout.com",
    getPayPalDomain: () => "https://www.te-gpay-api-e2e.qa.paypal.com",
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
                gatewayMerchantId: "H69FQ83GPQXP6",
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
