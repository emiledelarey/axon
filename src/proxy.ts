import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Anything inside these route groups requires a signed-in Clerk user. The landing
// page (/), sign-in/sign-up flows, and the API routes (which have their own
// rate limiting and are OK to hit anonymously for now) stay public.
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
