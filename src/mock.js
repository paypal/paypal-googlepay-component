/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable flowtype/no-weak-types */

/* @flow */
export  function googlePayConfig(): any {
    return (
        {
            data : {
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
                merchantId: "01234567890123456789",
                merchantOrigin: "sub-merchant.com",
                authJwt: "aaaaa.bbbbb.ccccc"
              }
            }
        }
    );
}