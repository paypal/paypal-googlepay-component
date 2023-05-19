/* @flow */

import { getClientID, getLogger, getMerchantID } from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";
import { getThreeDomainSecureComponent } from "@paypal/common-components/src/three-domain-secure";

import {
  PayPalGooglePayError,
  getMerchantDomain,
  getPayPalDomain,
  getConfigQuery,
} from "./util";
import {
  FPTI_TRANSITION,
  FPTI_CUSTOM_KEY,
  DEFAULT_GQL_HEADERS,
} from "./constants";
import { logGooglePayEvent } from "./logging";
import type {
  ConfigResponse,
  PayPalGooglePayErrorType,
  ConfirmOrderParams,
  ApprovePaymentResponse,
  InitiatePayerActionParams,
} from "./types";

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
      query: getConfigQuery(),
      variables: {
        clientId: getClientID(),
        merchantId: getMerchantID(),
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
      if (!data.googlePayConfig.isEligible) {
        throw new PayPalGooglePayError(
          "GOOGLEPAY_CONFIG_ERROR",
          "Not Eligible for GooglePay Payments",
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
  billingAddress,
  email,
}: ConfirmOrderParams): Promise<
  ApprovePaymentResponse | PayPalGooglePayErrorType
> {
  /** If the Merchant Choses to  */
  if (billingAddress && paymentMethodData?.info) {
    paymentMethodData.info.billingAddress = billingAddress;
  }
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
      return data.approveGooglePayPayment;
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

/**
 * Intiate 3DS Flow for User
 */
export function initiatePayerAction({
  orderId,
}: InitiatePayerActionParams): ZalgoPromise<boolean> {
  const promise = new ZalgoPromise();
  const threeds = getThreeDomainSecureComponent();

  // $FlowIssue - need to fix this type
  const instance = threeds({
    createOrder: () => orderId,
    onSuccess: (contingencyResult) => {
      logGooglePayEvent(FPTI_TRANSITION.GOOGLEPAY_TDS_SUCCESS);
      return promise.resolve({
        liabilityShift: contingencyResult.liability_shift,
      });
    },
    onCancel: () => {
      logGooglePayEvent(FPTI_TRANSITION.GOOGLEPAY_TDS_CANCEL);
      return promise.resolve({ liabilityShift: "UNKNOWN" });
    },
    onError: (err) => {
      logGooglePayEvent(FPTI_TRANSITION.GOOGLEPAY_TDS_ERROR);
      logGooglePayEvent(err && err.message);
      return promise.resolve({ liabilityShift: "UNKNOWN" });
    },
  });
  // $FlowIssue - need to fix this type
  return instance.renderTo(window, "body").then(() => promise);
}
