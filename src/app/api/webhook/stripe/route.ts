import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { DEFAULT_STATE, type AppState, type SubscriptionStatus } from "@/lib/state";

const TABLE = "user_state";

/**
 * POST /api/webhook/stripe
 * Stripe webhook ingest. Signature-verified via STRIPE_WEBHOOK_SECRET. We
 * handle the four events that change subscription entitlement:
 *
 *  - checkout.session.completed: first successful payment; create/activate.
 *  - customer.subscription.updated: period renewal, plan change, past_due
 *    transitions.
 *  - customer.subscription.deleted: cancellation took effect.
 *  - invoice.payment_failed: downgrade to past_due (Stripe will flip the
 *    subscription status itself, but this is a belt-and-braces log).
 *
 * Every handler finds the user by Clerk id stored either in the subscription
 * metadata or (on checkout.session.completed) the session's
 * client_reference_id, then upserts the user_state row.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set — rejecting webhook.");
    return new Response("Webhook not configured.", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature.", { status: 400 });

  // Stripe requires the raw body bytes for signature verification — Next's
  // req.text() is the supported way to get that in an App Router handler.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("webhook signature verification failed:", err);
    return new Response("Bad signature.", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.clerk_user_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!userId || !customerId || !subscriptionId) break;

        // Fetch the subscription so we capture the current_period_end + status
        // even though the session hands us only a reference.
        const subObj = await stripe().subscriptions.retrieve(subscriptionId);
        await writeSubscription(userId, {
          status: subObj.status as SubscriptionStatus,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          currentPeriodEnd: isoFromUnix(
            (subObj as unknown as { current_period_end?: number }).current_period_end,
          ),
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subObj = event.data.object as Stripe.Subscription;
        const userId = subObj.metadata?.clerk_user_id;
        if (!userId) break;
        const customerId =
          typeof subObj.customer === "string" ? subObj.customer : subObj.customer.id;
        await writeSubscription(userId, {
          status: subObj.status as SubscriptionStatus,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subObj.id,
          currentPeriodEnd: isoFromUnix(
            (subObj as unknown as { current_period_end?: number }).current_period_end,
          ),
        });
        break;
      }
      case "invoice.payment_failed": {
        // Stripe updates the subscription to past_due and fires
        // customer.subscription.updated right after. Nothing extra to do here.
        break;
      }
      default:
        // Log unknown types so we can extend as needed.
        console.log("stripe webhook unhandled:", event.type);
    }
  } catch (err) {
    console.error("webhook handler error:", err);
    return new Response("Handler error.", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

type WireSub = {
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string | null;
};

/**
 * Reads the user's current state blob, merges the new subscription field,
 * and writes it back. If no row exists yet (new Stripe user, first payment)
 * we seed with DEFAULT_STATE so future reads find the full shape.
 */
async function writeSubscription(userId: string, sub: WireSub): Promise<void> {
  const { data } = await supabase().from(TABLE).select("state").eq("user_id", userId).maybeSingle();

  const existing = (data?.state as AppState | undefined) ?? DEFAULT_STATE;
  const nextState: AppState = { ...existing, subscription: sub };

  const { error } = await supabase().from(TABLE).upsert(
    {
      user_id: userId,
      state: nextState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error(`user_state upsert failed: ${error.message}`);
  }
}

function isoFromUnix(ts: number | undefined): string | null {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000).toISOString();
}
