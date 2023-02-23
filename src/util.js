export class PayPalGooglePayError extends Error {
    paypalDebugId: null | string;
    errorName: string;
    constructor(name: string, message: string, paypalDebugId: null | string) {
      super(message);
      this.name = "PayPalGooglePayError";
      this.errorName = name;
      this.paypalDebugId = paypalDebugId;
    }
  }

  export function getMerchantDomain(): string {
    const url = window.location.origin;
    return url.split("//")[1];
  }