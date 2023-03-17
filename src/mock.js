/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable flowtype/no-weak-types */

/* @flow */
export function googlePayConfig(): any {
  return {
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: [
            "AMEX",
            "DISCOVER",
            "JCB",
            "MASTERCARD",
            "VISA",
          ],
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "paypalqa",
            gatewayMerchantId: "12345678901234567890",
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: "12345678901234567890",
      merchantOrigin: "stage-googlepay-paypal-js-sdk.herokuapp.com",
      merchantName: "paypal",
      authJwt:
        "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXJjaGFudElkIjoiNkpUUUhMVjRRSDlUSiIsIm1lcmNoYW50T3JpZ2luIjoic3RhZ2UtZ29vZ2xlcGF5LXBheXBhbC1qcy1zZGsuaGVyb2t1YXBwLmNvbSIsImlhdCI6MTY3NzgwMzYxNn0.yrfBfux_KtpMoUXZTDkwVyQN02aiI4cKOGgUvwkjr5K7SsCYf51nGmMpDBT2RYw4XHHDokwGO2IBfok_CIoWwA",
    },
  };
}
