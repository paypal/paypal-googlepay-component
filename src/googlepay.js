import {
    getClientID,
    getMerchantID,
    getLogger,
    getBuyerCountry,
    getPayPalDomain,
    getPayPalAPIDomain,
    getPartnerAttributionID,
  } from "@paypal/sdk-client/src";
  import { FPTI_KEY } from "@paypal/sdk-constants/src";
  
  import {
    getMerchantDomain,
    mapGetConfigResponse,
    PayPalApplePayError,
  } from "./util";
  import type {
    ConfigResponse,
    CreateOrderResponse,
    OrderPayload,
    ValidateMerchantParams,
    ApplepayType,
    ConfirmOrderParams,
    PayPalApplePayErrorType,
    ValidateMerchantResponse,
  } from "./types";
  import {
    FPTI_TRANSITION,
    FPTI_CUSTOM_KEY,
    DEFAULT_API_HEADERS,
    DEFAULT_GQL_HEADERS,
  } from "./constants";
  import { logApplePayEvent } from "./logging";

export async function googlePayConfig(){
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
            throw new PayPalApplePayError(
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
            throw new PayPalApplePayError(
              "APPLEPAY_CONFIG_ERROR",
              message,
              extensions?.correlationId
            );
          }
    
          return mapGetConfigResponse(data.applepayConfig);
        })
        .catch((err) => {
          getLogger()
            .error(FPTI_TRANSITION.APPLEPAY_CONFIG_ERROR)
            .track({
              [FPTI_KEY.TRANSITION]: FPTI_TRANSITION.APPLEPAY_CONFIG_ERROR,
              [FPTI_CUSTOM_KEY.ERR_DESC]: `Error: ${err.message}) }`,
            })
            .flush();
    
          throw err;
        });
}