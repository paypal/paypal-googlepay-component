/* @flow */

import { getClientID, getLogger } from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import { PayPalGooglePayError } from "./util";
import {
  getClientID,
  getLogger,
  getPayPalAPIDomain,
} from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";

import { PayPalGooglePayError } from "./util";
import {
  FPTI_TRANSITION,
  FPTI_CUSTOM_KEY,
  DEFAULT_GQL_HEADERS,
  DEFAULT_API_HEADERS,
} from "./constants";
import { logGooglePayEvent } from "./logging";
import type {
  ConfigResponse,
  PayPalGooglePayErrorType,
  ConfirmOrderParams,
  ApprovePaymentResponse,
  OrderPayload,
  CreateOrderResponse,
} from "./types";
import { getThreeDomainSecureComponent } from "@paypal/common-components/src/three-domain-secure";

export async function createOrder(
  payload: OrderPayload
): Promise<CreateOrderResponse> {
  const basicAuth = btoa(`${getClientID()}`);

  try {
    const accessToken = await fetch(
      `https://api.te-gpay-api-e2e.qa.paypal.com/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
        body: "grant_type=client_credentials",
      }
    )
      .then((res) => {
        return res.json();
      })
      .then(({ access_token }) => {
        return access_token;
      });

    const res = await fetch(
      `https://api.te-gpay-api-e2e.qa.paypal.com/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          ...DEFAULT_API_HEADERS,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    ).catch((err) => {
      throw err;
    });

    const { id, status } = await res.json();

    return {
      id,
      status,
    };
  } catch (error) {
    getLogger()
      .error(FPTI_TRANSITION.GOOGLEPAY_CREATE_ORDER_ERROR)
      .track({
        [FPTI_KEY.TRANSITION]: FPTI_TRANSITION.GOOGLEPAY_CREATE_ORDER_ERROR,
        [FPTI_CUSTOM_KEY.ERR_DESC]: `Error: ${error.message}) }`,
      })
      .flush();
    throw error;
  }
}

export function googlePayConfig(): Promise<
  ConfigResponse | PayPalGooglePayErrorType
> {
  logGooglePayEvent("GetApplepayConfig");
  const host = "https://www.te-gpay-api-e2e.qa.paypal.com";
  const localHost = "https://localhost.paypal.com:9000";
  return fetch(`${localHost}/graphql?GetGooglePayConfig`, {
    method: "POST",
    headers: {
      ...DEFAULT_GQL_HEADERS,
    },
    body: JSON.stringify({
      query: `
                    query getGooglePayConfig(
                        $clientId: String!
                        $merchantOrigin: String!
                    ) {
                        googlePayConfig(
                        clientId: $clientId
                        merchantOrigin:$merchantOrigin
                        ){
                        allowedPaymentMethods{
                            type
                            parameters{
                            allowedAuthMethods
                            allowedCardNetworks
                            billingAddressRequired
                            assuranceDetailsRequired
                            billingAddressParameters {
                              format
                            }
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
                            merchantOrigin
                            merchantId
                        }
                        }
                    }`,
      variables: {
        clientId:
          "B_AMvrD5p50dtQXhxF2gaQYxM3zxsQP6RVTLfx1JN5aGgPSDy1zR-EonK0ED3DZlxfyi28odj2IR1pnJBk",
        merchantOrigin: "https://stage-googlepay-paypal-js-sdk.herokuapp.com",
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

      return data.googlePayConfig;
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
  shippingAddress,
  email,
}: ConfirmOrderParams): Promise<
  ApprovePaymentResponse | PayPalGooglePayErrorType
> {
  logGooglePayEvent("paymentauthorized");
  const host = "https://www.te-gpay-api-e2e.qa.paypal.com";
  const localHost = "https://localhost.paypal.com:9000";
  return fetch(`${localHost}/graphql?ApproveGooglePayPayment`, {
    method: "POST",
    headers: {
      ...DEFAULT_GQL_HEADERS,
    },
    body: JSON.stringify({
      query: `
                    mutation ApproveGooglePayPayment(
                      $paymentMethodData: GooglePayPaymentMethodData!
                      $orderID: String!
                      $clientID : String!
                      $shippingAddress: GooglePayPaymentContact
                      $email: String
                    ) {
                      approveGooglePayPayment(
                        paymentMethodData: $paymentMethodData
                        orderID: $orderID
                        clientID: $clientID
                        shippingAddress: $shippingAddress
                        email: $email
                      )
                    }`,
      variables: {
        paymentMethodData,
        clientID: getClientID(),
        orderID: orderId,
        shippingAddress,
        email,
      },
    }),
  })
    .then((res) => {
      if (
        res.status === 422 &&
        res.body?.details?.[0]?.issue === "PAYER_ACTION_REQUIRED"
      ) {
        const promise = new ZalgoPromise();
        const threeds = getThreeDomainSecureComponent();
        const instance = threeds({
          createOrder: () => orderId,
          onSuccess: (err, res) => {
            return promise.resolve("3DS Success");
          },
          onCancel: () => promise.reject(new Error(`3DS cancelled`)),
          onError: (err) => {
            return promise.resolve("3DS Failed");
          },
        });
        return instance.renderTo(window, "body", "popup").then(() => promise);
      }
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

      return data.googlePayConfig;
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
