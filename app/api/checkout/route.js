import Stripe from "stripe";
import { products } from "../../../lib/products";

export async function POST(req) {
  const { productId } = await req.json();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return Response.json({ error: "Unknown product" }, { status: 400 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json(
      { error: "Add STRIPE_SECRET_KEY in .env.local (Stripe Dashboard → Developers → API keys)." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "hkd",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "hkd",
          unit_amount: product.priceHkd,
          product_data: { name: product.name, description: product.desc },
        },
      },
    ],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
  });

  return Response.json({ url: session.url });
}
