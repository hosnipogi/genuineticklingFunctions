import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export class WooCommerce {
  public api: WooCommerceRestApi;

  constructor(consumerKey: string, consumerSecret: string) {
    this.api = new WooCommerceRestApi({
      url: "https://genuinetickling.com",
      consumerKey,
      consumerSecret,
      version: "wc/v3",
    });
  }
}
