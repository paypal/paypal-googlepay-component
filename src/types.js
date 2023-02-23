/* @flow */



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
