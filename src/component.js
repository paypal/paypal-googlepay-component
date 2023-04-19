/* @flow */

import { confirmOrder, googlePayConfig, intiatePayerAction } from "./googlepay";
import type { GooglePayType } from "./types";

export function GooglePay(): GooglePayType {
  return {
    config: googlePayConfig,
    confirmOrder,
    intiatePayerAction,
  };
}
