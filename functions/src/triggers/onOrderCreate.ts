import { https, logger } from "firebase-functions";
import stripe from "../lib/stripe";

/**
 * 1. Search Stripe if customer exists, if not create new customer
 * 2. Create a new Invoice for the purchase with a due date of n days
 * 3. Create new Invoice item and attach to above Invoice
 * 4. Finalize and email the Invoice to customer
 */

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
      days_until_due: 3,
      auto_advance: false,
      metadata: { order_id: order },
    });

    if (!invoice.id) throw new Error("Invoice creation failed");

    await stripe.invoiceItems.create({
      customer: customerID,
      amount: +(parseFloat(Price) * 100).toFixed(),
      currency: "EUR",
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
