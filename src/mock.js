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
    },
  };
}

export function approveGooglePayPaymentWith3DS(): any {
  return {
    status: "PAYER_ACTION_REQUIRED",
    payment_source: null,
    links: [
      {
        href: "https://www.msmaster1int.qa.paypal.com/webapps/helios?action=verify&flow=3ds&cart_id=87669629F7083071T",
        rel: "payer-action",
        method: "GET",
      },
      {
        href: "https://developer.paypal.com/docs/api/orders/v2/#error-PAYER_ACTION_REQUIRED",
        rel: "information_link",
        method: "GET",
      },
    ],
  };
}
