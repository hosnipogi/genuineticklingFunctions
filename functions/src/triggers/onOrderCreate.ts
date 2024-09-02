import { https, logger } from "firebase-functions";
import stripe from "../lib/stripe";
import { z } from "zod";

const bodySchema = z.object({
  Email: z.string().email(),
  Name: z.string().min(1),
  Price: z.coerce.number(),
  order: z.number(),
});

/**
 * 1. Search Stripe if customer exists, if not create new customer
 * 2. Create a new Invoice for the purchase with a due date of n days
 * 3. Create new Invoice item and attach to above Invoice
 * 4. Finalize and email the Invoice to customer
 */

export default https.onRequest(async (request, response) => {
  try {
    const DEADLINE = new Date("September 4, 2024").getTime();
    if (Date.now() > DEADLINE) {
      throw new Error("DEADLINE REACHED");
    }

    const body = bodySchema.parse(request.body);
    const { Email, Name, Price, order } = body;

    logger.info("New request received body: ", body);

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
      currency: "EUR",
      metadata: { order_id: order },
    });

    logger.info("Created Invoice", invoice);

    if (!invoice.id) throw new Error("Invoice creation failed");

    const item = await stripe.invoiceItems.create({
      customer: customerID,
      amount: Price * 100,
      currency: "EUR",
      invoice: invoice.id,
      description: `Space Opera Order# ${order}`,
    });

    logger.info("Created Invoice Item", item);

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
