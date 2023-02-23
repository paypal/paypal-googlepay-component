/* @flow */

export type PayPalGooglePayErrorType = {|
    name: string,
    message: string,
    paypalDebugId: null | string,
  |};

export type ConfigResponse = {|
      allowedPaymentMethods: $ReadOnlyArray<{|
        parameters: {|
          allowedAuthMethods: $ReadOnlyArray<string>,
          allowedCardNetworks: $ReadOnlyArray<string>
        |},
        tokenizationSpecification: {|
          parameters: {|
            gateway: string,
            gatewayMerchantId: string
          |},
          type: string
        |},
        type: string
      |}>,
      merchantInfo: {|
        authJwt: string,
        merchantId: string,
        merchantName: string,
        merchantOrigin: string
      |}
    |}

export type GooglePayType = {|
    config: () => Promise<ConfigResponse | PayPalGooglePayErrorType>,
    confirmOrder: () => Promise<string>
  |}