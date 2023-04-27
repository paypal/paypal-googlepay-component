/* @flow */

import { confirmOrder, googlePayConfig, intiatePayerAction } from "./googlepay";
import type { GooglePayType } from "./types";

export function Googlepay(): GooglePayType {
  return {
    config: googlePayConfig,
    confirmOrder,
    intiatePayerAction,
  };
}
