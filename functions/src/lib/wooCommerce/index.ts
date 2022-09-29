import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export default new WooCommerceRestApi({
  url: "https://genuinetickling.com",
  consumerKey: process.env.WOO_COMMERCE_CONSUMER_KEY!,
  consumerSecret: process.env.WOO_COMMERCE_CONSUMER_SECRET!,
  version: "wc/v3",
});
