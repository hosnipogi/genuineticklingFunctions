import Stripe from "stripe";

export { EVENTS } from "./eventsEnum";
export default new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2024-06-20",
});
