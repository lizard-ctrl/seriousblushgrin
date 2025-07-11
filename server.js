// Load environment variables
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json()); // Needed to parse JSON body from POST

const YOUR_DOMAIN = "http://localhost:5500";

// Create Checkout Session dynamically from priceId
app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;

  if (!priceId) {
    return res.status(400).json({ error: "Missing priceId in request body." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "custom",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 699, // $5.00 shipping
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500, // $15.00 expedited
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 2 },
            },
          },
        }
      ],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${YOUR_DOMAIN}/return.html?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Optionally return product name/image
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);

    res.send({
      clientSecret: session.client_secret,
      product: {
        name: product.name,
        image: product.images[0] || '',
      },
    });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Return session status (already working)
app.get("/session-status", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.send({
      status: session.status,
      customer_email: session.customer_details.email
    });
  } catch (err) {
    console.error("Error retrieving session:", err);
    res.status(500).json({ error: "Failed to retrieve session status" });
  }
});

app.listen(4242, () => console.log("Running on port 4242"));
