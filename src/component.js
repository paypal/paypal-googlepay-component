/* @flow */

import {
  confirmOrder,
  googlePayConfig,
  initiatePayerAction,
} from "./googlepay";
import type { GooglePayType } from "./types";

export function Googlepay(): GooglePayType {
  return {
    config: googlePayConfig,
    confirmOrder,
    initiatePayerAction,
  };
}
