/* @flow */

import {
  getPayPalDomain as getDefaultPayPalDomain,
  getPayPalAPIDomain as getDefaultPayPalAPIDomain,
  getEnv,
} from "@paypal/sdk-client/src";
import { ENV } from "@paypal/sdk-constants/src";

import { LOCAL_HOST, API_HOST } from "./constants";

export class PayPalGooglePayError extends Error {
  paypalDebugId: null | string;
  errorName: string;
  constructor(name: string, message: string, paypalDebugId: null | string) {
    super(message);
    this.name = "PayPalGooglePayError";
    this.errorName = name;
    this.paypalDebugId = paypalDebugId;
  }
}

export function getMerchantDomain(): string {
  const url = window.location.origin;
  return url.split("//")[1];
}

export function getPayPalDomain(): string {
  return getEnv() === ENV.LOCAL ? LOCAL_HOST : getDefaultPayPalDomain();
}

export function getPayPalAPIDomain(): string {
  return getEnv() === ENV.LOCAL ? API_HOST : getDefaultPayPalAPIDomain();
}

export function getConfigQuery(): string {
  if (getEnv() === ENV.PRODUCTION) {
    return `
    query getGooglePayConfig(
        $clientId: String!
        $merchantId: [String]
        $merchantOrigin: String!
    ) {
        googlePayConfig(
        clientId: $clientId
        merchantId: $merchantId
        merchantOrigin: $merchantOrigin
        ){
        isEligible
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
            authJwt
        }
        }
    }`;
  } else {
    return `
    query getGooglePayConfig(
        $clientId: String!
        $merchantId: [String]
        $merchantOrigin: String!
    ) {
        googlePayConfig(
        clientId: $clientId
        merchantId: $merchantId
        merchantOrigin: $merchantOrigin
        ){
        isEligible
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
    }`;
  }
}
