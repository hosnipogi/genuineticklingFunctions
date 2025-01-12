import Stripe from "stripe";

export default new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
