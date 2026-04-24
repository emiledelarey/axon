import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session for Axon Pro and returns the URL.
 * The client redirects the browser there; Stripe handles the payment UI.
 * On success Stripe fires checkout.session.completed into our webhook,
 * which is where we actually record the subscription.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return Response.json({ error: "Checkout not configured." }, { status: 500 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? undefined;

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://axon.napkin.group";

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id is the bridge the webhook uses to find the user.
      // Stripe's customer object gets linked by this on the first payment.
      client_reference_id: userId,
      customer_email: email,
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      subscription_data: {
        metadata: { clerk_user_id: userId },
      },
      metadata: { clerk_user_id: userId },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return Response.json({ error: "Stripe did not return a URL." }, { status: 500 });
    }
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return Response.json(
      { error: "Could not start checkout. Try again in a moment." },
      { status: 500 },
    );
  }
}
