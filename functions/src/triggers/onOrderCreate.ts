import { https, logger } from "firebase-functions";
import stripe from "../lib/stripe";

export default https.onRequest(async (request, response) => {
  try {
    const { Email, Name, Price, order } = request.body;

    if (!Email || !Name || !Price || !order)
      throw new Error("Check request body");

    let customerID: string;

    const customer = await stripe.customers.search({
      query: `email:"${Email}"`,
    });

    logger.info("Customer info", customer);

    if (!customer.data.length) {
      const newCustomer = await stripe.customers.create({
        name: Name,
        email: Email,
      });
      customerID = newCustomer.id;
    } else {
      customerID = customer.data[0].id;
    }

    const invoice = await stripe.invoices.create({
      customer: customerID,
      collection_method: "send_invoice",
      days_until_due: 30,
      auto_advance: false,
      metadata: { order_id: order },
    });

    if (!invoice.id) throw new Error("Invoice creation failed");

    await stripe.invoiceItems.create({
      customer: customerID,
      amount: +parseFloat(Price).toFixed(2) * 100,
      currency: "USD",
      invoice: invoice.id,
      description: `Space Opera Order# ${order}`,
    });

    await stripe.invoices.sendInvoice(invoice.id);

    response.send({
      invoiceID: invoice.id,
      orderID: order,
    });
  } catch (e) {
    if (e instanceof Error) {
      logger.error(e);
      response.status(500).send(e.message);
    }
  }
});
