/* @flow */


import {
    getLogger,
    getPayPalDomain,
  } from "@paypal/sdk-client/src";
  import { FPTI_KEY } from "@paypal/sdk-constants/src";
  
  import {
    PayPalGooglePayError,
  } from "./util";
  import {
    FPTI_TRANSITION,
    FPTI_CUSTOM_KEY,
    DEFAULT_GQL_HEADERS,
  } from "./constants";
  import  { logGooglePayEvent } from "./logging";
  import type { ConfigResponse} from './types' 
 
export function googlePayConfig(): Promise<ConfigResponse> | PayPalGooglePayError {
    logGooglePayEvent("GetApplepayConfig")
    return fetch(`${getPayPalDomain()}/graphql?GetApplepayConfig`, {
        method: "POST",
        headers: {
          ...DEFAULT_GQL_HEADERS,
        },
        body: JSON.stringify({
          query: `
                    query getGooglePayConfig(
                        $clientId: String!
                        $merchantId: [String]!
                        $merchantOrigin: String!
                    ) {
                        googlePayConfig(
                        clientId: $clientId
                        merchantId:$merchantId
                        merchantOrigin:$merchantOrigin
                        ){
                        allowedPaymentMethods{
                            type
                            parameters{
                            allowedAuthMethods
                            allowedCardNetworks
                            }
                            tokenizationSpecification{
                            type
                            parameters {
                                gateway
                                gatewayMerchantId
                            }
                            }
                        }
                        merchantInfo {
                            merchantName
                            merchantOrigin
                            merchantId
                            authJwt
                        }
                        }
                    }`,
          variables: {
            clientId: 'B_AMvrD5p50dtQXhxF2gaQYxM3zxsQP6RVTLfx1JN5aGgPSDy1zR-EonK0ED3DZlxfyi28odj2IR1pnJBk',
            merchantOrigin: "www.checkout.com",
            merchantId: ["6JTQHLV4QH9TJ"],
          },
        }),
      })
        .then((res) => {
          if (!res.ok) {
            const { headers } = res;
            throw new PayPalGooglePayError(
              "INTERNAL_SERVER_ERROR",
              "An internal server error has occurred",
              headers.get("Paypal-Debug-Id")
            );
          }
          return res.json();
        })
        .then(({ data, errors, extensions }) => {
          if (Array.isArray(errors) && errors.length) {
            const message = errors[0]?.message ?? JSON.stringify(errors[0]);
            throw new PayPalGooglePayError(
              "GOOGLEPAY_CONFIG_ERROR",
              message,
              extensions?.correlationId
            );
          }
    
          return (data.googlepayConfig);
        })
        .catch((err) => {
          getLogger()
            .error(FPTI_TRANSITION.GOOGLEPAY_CONFIG_ERROR)
            .track({
              [FPTI_KEY.TRANSITION]: FPTI_TRANSITION.GOOGLEPAY_CONFIG_ERROR,
              [FPTI_CUSTOM_KEY.ERR_DESC]: `Error: ${err.message}) }`,
            })
            .flush();
    
          throw err;
        });
}