/* @flow */

import {
  getClientID,
  getLogger,
  getPayPalDomain,
} from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";
import { getThreeDomainSecureComponent } from "@paypal/common-components/src/three-domain-secure";
import { type ZoidComponent } from "@krakenjs/zoid/src";

import { PayPalGooglePayError, getMerchantDomain } from "./util";
import {
  FPTI_TRANSITION,
  FPTI_CUSTOM_KEY,
  DEFAULT_GQL_HEADERS,
  DEFAULT_API_HEADERS,
  LOCAL_HOST,
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

type GooglePayTDSProps = {|
  onSuccess: () => ZalgoPromise<ApprovePaymentResponse>,
  onError: (mixed) => ZalgoPromise<ApprovePaymentResponse>,
  onCancel: () => ZalgoPromise<ApprovePaymentResponse>,
  createOrder: () => string,
|};

type GooglePayTDSComponent = ZoidComponent<GooglePayTDSProps>;

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
  return fetch(
    `${LOCAL_HOST || getPayPalDomain()}/graphql?GetGooglePayConfig`,
    {
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
    }
  )
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

  return fetch(
    `${LOCAL_HOST || getPayPalDomain()}/graphql?ApproveGooglePayPayment`,
    {
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
    }
  )
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
      const approveGooglePayPayment = data.approveGooglePayPayment;
      const { status } = approveGooglePayPayment;
      const promise = new ZalgoPromise();
      if (status === "APPROVED") {
        const threeds: GooglePayTDSComponent = getThreeDomainSecureComponent();
        const instance = threeds({
          createOrder: () => "35W41291LJ903173X",
          onSuccess: () => {
            return promise.resolve(approveGooglePayPayment);
          },
          onCancel: () => {
            return promise.resolve(approveGooglePayPayment);
          },
          onError: () => {
            return promise.resolve(approveGooglePayPayment);
          },
        });
        return instance.renderTo(window, "body", "popup").then(() => promise);
      }
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
      return approveGooglePayPayment;
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
