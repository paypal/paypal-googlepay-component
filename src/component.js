/* @flow */


import { googlePayConfig } from './googlepay'
import type { ConfigResponse, PayPalGooglePayErrorType, GooglePayType } from "./types"; 

function config():Promise<ConfigResponse | PayPalGooglePayErrorType>{
  return googlePayConfig();
}

function confirmOrder(): Promise<string>{
  return Promise.resolve("Some response")
}

export function GooglePay(): GooglePayType {
    return {
        config,
        confirmOrder
    }
}