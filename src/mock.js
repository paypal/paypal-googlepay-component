/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable flowtype/no-weak-types */

/* @flow */
export  function googlePayConfig(): any {
    return (
        {
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
                // merchantId: "12345678901234567890",
                merchantId: "6JTQHLV4QH9TJ",
                merchantOrigin: "stage-googlepay-paypal-js-sdk.herokuapp.com",
                merchantName: "Test Merchant"
              }
        }
    );
}