/* @flow */
import type { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

export type OrderPayload = {|
  intent: string,
  purchase_units: $ReadOnlyArray<{|
    amount: {| currency_code: string, value: string |},
    payee: {| merchant_id: string |},
  |}>,
|};

export type PayPalGooglePayErrorType = {|
  name: string,
  message: string,
  paypalDebugId: null | string,
|};

export type ConfigResponse = {|
  allowedPaymentMethods: $ReadOnlyArray<{|
    parameters: {|
      allowedAuthMethods: $ReadOnlyArray<string>,
      allowedCardNetworks: $ReadOnlyArray<string>,
    |},
    tokenizationSpecification: {|
      parameters: {|
        gateway: string,
        gatewayMerchantId: string,
      |},
      type: string,
    |},
    type: string,
  |}>,
  merchantInfo: {|
    authJwt: string,
    merchantId: string,
    merchantName: string,
    merchantOrigin: string,
  |},
|};

export type ApprovePaymentResponse = {|
  id: string,
  status: string,
  payment_source: {|
    google_pay: {|
      name: string,
      card: {|
        last_digits: string,
        type: string,
        brand: string,
      |},
    |},
  |},
  links: $ReadOnlyArray<{|
    href: string,
    rel: string,
    method: string,
  |}>,
|};

export type GooglePayPaymentContact = {|
  name: string,
  postalCode: string,
  countryCode: string,
  phoneNumber: string,
  address1: string,
  address2: string,
  address3: string,
  locality: string,
  administrativeArea: string,
  sortingCode: string,
|};

export type AssuranceDetailsSpec = {|
  accountVerified: boolean,
  cardHolderAuthenticated: boolean,
|};

export type CardInfo = {|
  cardDetails: string,
  cardNetwork: string,
  assuranceDetails: AssuranceDetailsSpec,
  billingAddress?: GooglePayPaymentContact,
|};

export type GooglePayTokenizationData = {|
  type: string,
  token: string,
|};
export type GooglePayPaymentMethodData = {|
  description: string | null,
  tokenizationData: GooglePayTokenizationData,
  type: string,
  info: CardInfo,
|};

export type ConfirmOrderParams = {|
  paymentMethodData: GooglePayPaymentMethodData,
  orderId: string,
  shippingAddress?: GooglePayPaymentContact,
  billingAddress?: GooglePayPaymentContact,
  email?: string,
|};

export type CreateOrderResponse = {|
  id: string,
  status: string,
|};

export type InitiatePayerActionParams = {|
  orderId: string,
|};

export type GooglePayType = {|
  config: () => Promise<ConfigResponse | PayPalGooglePayErrorType>,
  confirmOrder: (ConfirmOrderParams) => Promise<
    ApprovePaymentResponse | PayPalGooglePayErrorType
  >,
  intiatePayerAction: (
    initiatePayerActionParams: InitiatePayerActionParams
  ) => ZalgoPromise<boolean>,
|};
