import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Anything inside these route groups requires a signed-in Clerk user at the
// proxy layer. The landing page (/) and sign-in/sign-up flows stay public.
//
// API routes are intentionally NOT proxy-gated — each route handler calls
// `requireUser()` from @/lib/server-auth itself so it can return a typed 401.
// The Stripe webhook (`/api/webhook/stripe`) is the only API route that must
// be hit anonymously; it verifies authenticity via HMAC signature instead.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/study(.*)",
  "/coach(.*)",
  "/tutor(.*)",
  "/library(.*)",
  "/cohort(.*)",
  "/roadmap(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Clerk's recommended matcher: skip static assets and Next internals, run on
  // everything else including API routes so server-side auth helpers work.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
