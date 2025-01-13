import { https, logger } from "firebase-functions/v2";
import type Stripe from "stripe";
import { WooCommerce } from "../lib/wooCommerce";
import { defineString } from "firebase-functions/params";
import { StripeClient } from "../lib/stripe";

const stripeWebhookSecret = defineString("STRIPE_WEBHOOK_SECRET_KEY");
const wooCommerceConsumerKey = defineString("WOO_COMMERCE_CONSUMER_KEY");
const wooCommerceConsumerSecret = defineString("WOO_COMMERCE_CONSUMER_SECRET");
const stripeApiKey = defineString("STRIPE_API_KEY");

/**
 * 1. Setup stripe webhook, verify signature on every request
 * 2. When Invoice is paid, update woocommerce order status to ```complete```
 */

export default https.onRequest(async (request, response) => {
  try {
    const sig = request.headers["stripe-signature"];
    if (!sig) throw new Error("Invalid Stripe signature");

    const stripe = new StripeClient(stripeApiKey.value());
    const wooCommerce = new WooCommerce(
      wooCommerceConsumerKey.value(),
      wooCommerceConsumerSecret.value()
    );

    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      stripeWebhookSecret.value()
    );

    switch (event.type) {
      case "invoice.paid": {
        logger.info({
          message: "New Stripe INVOICE Paid Event",
          data: event.data,
        });

        const { metadata } = event.data.object as Stripe.Invoice;
        if (!metadata?.order_id) throw new Error("Missing Woo order_id");

        logger.info("Invoice Paid event success");

        await wooCommerce.api.put("orders/" + metadata.order_id, {
          status: "completed", // See more in https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties
        });

        break;
      }
      default:
        break;
    }

    response.send("Stripe webhook success");
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      response.status(500).send(e.message);
    }
  }
});
