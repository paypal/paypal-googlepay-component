/* @flow */


import {
  getClientID,
  getLogger,

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
  import type { ConfigResponse, PayPalGooglePayErrorType, ConfirmOrderParams, ApprovePaymentResponse } from "./types"; 
 
export function googlePayConfig(): Promise<ConfigResponse | PayPalGooglePayErrorType> {
    logGooglePayEvent("GetApplepayConfig")
    return fetch(`https://www.te-googlepay-sdk.qa.paypal.com/graphql?GetGooglePayConfig`, {
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
    
          return (data.googlePayConfig);
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

export function confirmOrder({
  orderId,
  paymentMethodData,
  shippingAddress
}: ConfirmOrderParams): Promise<ApprovePaymentResponse | PayPalGooglePayErrorType> {

  logGooglePayEvent("paymentauthorized");

  const billingContact = paymentMethodData?.info?.billingAddress;
  return fetch(`https://www.te-googlepay-sdk.qa.paypal.com/graphql?ApproveGooglePayPayment`, {
    method: "POST",
    headers: {
      ...DEFAULT_GQL_HEADERS
    },
    body: JSON.stringify({
      query: `
                    mutation ApproveGooglePayPayment(
                      $paymentMethodData: GooglePayPaymentMethodData!
                      $orderID: String!
                      $clientID : String!
                      $billingContact: GooglePayPaymentContact!
                    ) {
                      approveGooglePayPayment(
                        paymentMethodData: $paymentMethodData
                        orderID: $orderID
                        clientID: $clientID
                        billingContact: $billingContact
                        shippingContact: $shippingContact
                      )
                    }`,
      variables: {
        paymentMethodData,
        clientID: getClientID(),
        orderID: orderId,
        billingContact,
        shippingContact: shippingAddress
      },
    }),
  })
    .then((res) => {
      if (!res.ok) {
        const { headers } = res;
        const error = {
          name: "INTERNAL_SERVER_ERROR",
          fullDescription: "An internal server error has occurred",
          paypalDebugId: headers.get("Paypal-Debug-Id"),
        };

        throw new PayPalGooglePayError(
          error.name,
          error.fullDescription,
          error.paypalDebugId
        );
      }
      return res.json();
    })
    .then(({ data, errors, extensions }) => {
      if (Array.isArray(errors) && errors.length) {
        const error = {
          name: errors[0]?.name || "GOOGLEPAY_PAYMENT_ERROR",
          fullDescription: errors[0]?.message ?? JSON.stringify(errors[0]),
          paypalDebugId: extensions?.correlationId,
        };

        throw new PayPalGooglePayError(
          error.name,
          error.fullDescription,
          error.paypalDebugId
        );
      }
      return (data.approveGooglePayPayment);
    })
    .catch((err) => {
      getLogger()
        .error(FPTI_TRANSITION.GOOGLEPAY_PAYMENT_ERROR)
        .track({
          [FPTI_KEY.TRANSITION]: FPTI_TRANSITION.GOOGLEPAY_PAYMENT_ERROR,
          [FPTI_CUSTOM_KEY.ERR_DESC]: `Error: ${err.message}) }`,
        })
        .flush();

      throw err;
    });
}