/* @flow */

import {
  getClientID,
  getLogger,
  getPayPalDomain,
} from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import { PayPalGooglePayError, getMerchantDomain } from "./util";
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
import { approveGooglePayPaymentWith3DS } from "./mock";

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
  return fetch(`${getPayPalDomain()}/graphql?GetGooglePayConfig`, {
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
        clientId: getClientID(),
        merchantOrigin: getMerchantDomain(),
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

  return fetch(`${getPayPalDomain()}/graphql?ApproveGooglePayPayment`, {
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
      const threedsresponse = approveGooglePayPaymentWith3DS();
      if (threedsresponse.status === "PAYER_ACTION_REQUIRED") {
        const promise = new ZalgoPromise();
        const threeds = getThreeDomainSecureComponent();
        const instance = threeds({
          createOrder: () => orderId,
          onSuccess: (err, res) => {
            return promise.resolve({ liabilityShifted: true });
          },
          onCancel: () => promise.resolve({ liabilityShifted: false }),
          onError: (err) => {
            return promise.resolve({ liabilityShifted: false });
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
      return data.approveGooglePayPayment;
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
