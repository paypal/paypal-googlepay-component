/* @flow */

import { getClientID } from "@paypal/sdk-client/src";
import { googlePayConfig } from './mock'

async function config(){
  return googlePayConfig();
}

async function confirmOrder(){
  
}
export const GooglePay = () => {
    return {
        config,
        confirmOrder
    }
}