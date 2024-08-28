import { https, logger } from "firebase-functions";
import Stripe from "stripe";
import { EVENTS } from "../lib/stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_API_KEY!, {
  apiVersion: "2024-06-20",
});

const endpointSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET_KEY!;

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
        logger.info("Invoice Paid event success");
        break;
      }
      default:
        logger.info("Unhandled event", event.type);
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
