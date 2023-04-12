/* @flow */

// import { googlePayConfig } from './mock'
import { confirmOrder, googlePayConfig, createOrder, intiatePayerAction } from "./googlepay";
import type { GooglePayType } from "./types";

export function GooglePay(): GooglePayType {
  return {
    config: googlePayConfig,
    confirmOrder,
    createOrder,
    intiatePayerAction
  };
}
