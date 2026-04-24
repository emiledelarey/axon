import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import type { AppState } from "@/lib/state";

/**
 * POST /api/billing-portal
 * Returns a Stripe Customer Portal URL the student can use to update card,
 * view invoices, or cancel. Requires that they already have a
 * stripeCustomerId — i.e. at least one successful checkout.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase()
    .from("user_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("billing-portal load error:", error);
    return Response.json({ error: "Could not load account." }, { status: 500 });
  }
  const state = data?.state as AppState | undefined;
  const customerId = state?.subscription?.stripeCustomerId;
  if (!customerId) {
    return Response.json({ error: "No subscription on file." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://axon.napkin.group";

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("billing-portal error:", err);
    return Response.json({ error: "Could not open billing portal. Try again." }, { status: 500 });
  }
}
