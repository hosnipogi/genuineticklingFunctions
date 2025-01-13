import Stripe from "stripe";

export class StripeClient extends Stripe {
  constructor(apiKey: string) {
    super(apiKey, {
      apiVersion: "2024-12-18.acacia",
    });
  }
}
