/* @flow */

import { getLogger } from "@paypal/sdk-client/src";
import { FPTI_KEY } from "@paypal/sdk-constants/src";

import { FPTI_TRANSITION, FPTI_CUSTOM_KEY } from "./constants"

export function logGooglePayEvent(event: string, payload: Object) {
  const data = payload || {};

  getLogger()
    .info(`${FPTI_TRANSITION.GOOGLEPAY_EVENT}_${event}`, data)
    .track({
      [FPTI_KEY.TRANSITION]: `${FPTI_TRANSITION.GOOGLEPAY_EVENT}_${event}`,
      [FPTI_CUSTOM_KEY.INFO_MSG]: JSON.stringify(data),
    })
    .flush();
}
