/* @flow */

export const DEFAULT_API_HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  
  type Headers = {|
    "x-app-name": string,
    "Content-Type": string,
    Accept: string,
    origin: string,
    prefer: string,
  |};
  
  export const DEFAULT_GQL_HEADERS: Headers = {
    "x-app-name": "sdk-googlepay",
    "Content-Type": "application/json",
    Accept: "application/json",
    origin: window.location,
    prefer: "return=representation",
  };
  
  export const FPTI_TRANSITION = {
    GOOGLEPAY_EVENT: ("googlepay_event": "googlepay_event"),
    GOOGLEPAY_FLOW_ERROR: ("googlepay_flow_error": "googlepay_flow_error"),
    GOOGLEPAY_ON_CLICK_INVALID:
      ("googlepay_onclick_invalid": "googlepay_onclick_invalid"),
    GOOGLEPAY_PAYMENT_ERROR: ("googlepay_payment_error": "googlepay_payment_error"),
    GOOGLEPAY_CONFIG_ERROR: ("googlepay_config_error": "googlepay_config_error"),
  };
  
  export const FPTI_CUSTOM_KEY = {
    ERR_DESC: ("int_error_desc": "int_error_desc"),
    INFO_MSG: ("info_msg": "info_msg"),
  };
  
  export const ORDER_INTENT = {
    CAPTURE: "CAPTURE",
    AUTHORIZE: "AUTHORIZE",
  };
  