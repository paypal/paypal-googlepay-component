// This is just a mock data file to build the component standalone without the integration with the XOBuyernodeserv
// Needs to be removed later



export const googlePayConfig = () => {
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
                merchantName: "Example Merchant",
                merchantId: "01234567890123456789",
                merchantOrigin: "sub-merchant.com",
                authJwt: "aaaaa.bbbbb.ccccc"
              }
            }
        }
    );
}


// export const approveGooglePayPayment = () => {
//     return();
// }