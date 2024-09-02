import { https, logger } from "firebase-functions";
import type Stripe from "stripe";
import stripe, { EVENTS } from "../lib/stripe";
import wooApi from "../lib/wooCommerce";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY!;

/**
 * 1. Setup stripe webhook, verify signature on every request
 * 2. When Invoice is paid, update woocommerce order status to ```complete```
 */

export default https.onRequest(async (request, response) => {
  try {
    const DEADLINE = new Date("September 4, 2024").getTime();
    if (Date.now() > DEADLINE) {
      throw new Error("DEADLINE REACHED");
    }

    const sig = request.headers["stripe-signature"];
    if (!sig) throw new Error("Invalid Stripe signature");

    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );

    switch (event.type) {
      case EVENTS.INVOICE_PAID: {
        logger.info({
          message: "New Stripe INVOICE Paid Event",
          data: event.data,
        });

        const { metadata } = event.data.object as Stripe.Invoice;
        if (!metadata?.order_id) throw new Error("Missing Woo order_id");

        logger.info("Invoice Paid event success");
        await wooApi.put("orders/" + metadata.order_id, {
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
