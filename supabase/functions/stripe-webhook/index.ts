import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cryptoProvider = crypto.subtle;

/**
 * Map Stripe price IDs to DraftKit tiers.
 * The env vars STRIPE_WRITER_PRICE_ID and STRIPE_PRO_PRICE_ID
 * should match the price IDs configured in your Stripe dashboard.
 */
function tierFromPriceId(priceId: string): "writer" | "pro" | null {
  const writerPriceId = Deno.env.get("STRIPE_WRITER_PRICE_ID");
  const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");

  if (priceId === writerPriceId) return "writer";
  if (priceId === proPriceId) return "pro";
  return null;
}

/**
 * Verify Stripe webhook signature using Web Crypto API (Deno-compatible).
 */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await cryptoProvider.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await cryptoProvider.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === signature;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const sigHeader = req.headers.get("stripe-signature");

  if (!sigHeader) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const isValid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const userId = session.metadata?.user_id as string | undefined;
        const tier = session.metadata?.tier as string | undefined;

        if (!userId || !tier) {
          console.error("Missing user_id or tier in session metadata");
          return new Response("Missing metadata", { status: 400 });
        }

        const { error } = await supabase
          .from("sw_user_profiles")
          .update({
            tier,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update user profile:", error.message);
          return new Response("Database update failed", { status: 500 });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined;

        if (!priceId) {
          console.error("Missing price ID in subscription");
          return new Response("Missing price ID", { status: 400 });
        }

        const tier = tierFromPriceId(priceId);
        if (!tier) {
          console.error("Unknown price ID:", priceId);
          return new Response("Unknown price ID", { status: 400 });
        }

        const { error } = await supabase
          .from("sw_user_profiles")
          .update({
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Failed to update subscription tier:", error.message);
          return new Response("Database update failed", { status: 500 });
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Internal server error", { status: 500 });
  }
});
