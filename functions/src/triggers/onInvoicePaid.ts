import { https, logger } from "firebase-functions";
import type Stripe from "stripe";
import stripe, { EVENTS } from "../lib/stripe";
import wooApi from "../lib/wooCommerce";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY!;

export default https.onRequest((request, response) => {
  try {
    const sig = request.headers["stripe-signature"];
    if (!sig) throw new Error("Invalid Stripe signature");

    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      endpointSecret
    );

    switch (event.type) {
      case EVENTS.INVOICE_PAID: {
        const { metadata } = event.data.object as Stripe.Invoice;
        if (!metadata?.order_id) throw new Error("Missing Woo order_id");

        logger.info("Invoice Paid event success");
        wooApi.put("orders/" + metadata.order_id, {
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
