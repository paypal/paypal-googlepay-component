/* @flow */

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


export type ApprovePaymentResponse = {|
    id: string,
    status: string,
    payment_source: {|
      google_pay : {|
        name: string,
        card: {|
          last_digits: string,
          type: string,
          brand: string
        |}
      |}
    |},
    links: $ReadOnlyArray<{|
      href: string,
      rel: string,
      method: string,

|}>,
 |}

 export type GooglePayPaymentContanct = {|
  name: string,
  postalCode: string,
  countryCode: string, 
  phoneNumber: string,
  address1: string,
  address2: string,
  address3: string,
  locality: string,
  administrativeArea: string, 
  sortingCode: string
|}


export type AssuranceDetailsSpec = {|
  accountVerified: boolean, 
  cardHolderAuthenticated: boolean
|}

export type CardInfo = {|
  cardDetails: string,
  cardNetwork: string,
  assuranceDetails: AssuranceDetailsSpec,
  billingAddress?: GooglePayPaymentContanct
|}


export type GooglePayTokenizationData = {|
    type: string,
    token: string
|}
export type GooglePayPaymentMethodData = {|
    description: string | null,
    tokenizationData: GooglePayTokenizationData,
    type: string,
    info: CardInfo

|}


export type ConfirmOrderParams = {|
  paymentMethodData: GooglePayPaymentMethodData,
  orderId: string,
  shippingAddress?: GooglePayPaymentContanct,
  email: string,
|}


export type CreateOrderResponse = {|
  id: string,
  status: string,
|};

 export type GooglePayType = {|
  createOrder(OrderPayload): Promise<CreateOrderResponse>,
  config: () => Promise<ConfigResponse | PayPalGooglePayErrorType>,
  confirmOrder: (ConfirmOrderParams) => Promise<ApprovePaymentResponse | PayPalGooglePayErrorType>
|}



