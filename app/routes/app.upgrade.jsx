import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/node"; // Only use server-specific imports in loader/action
// No direct import of "shopify.server.js" in client-side components

export const loader = async ({ request }) => {
  const { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } = import("../shopify.server");
  try {
    // Authenticate the admin and retrieve session data
    const { billing, session } = await authenticate.admin(request);
    if (!session) {
      throw new Error("Session not found");
    }

    // Extract shop name and format it
    let { shop } = session;
    let myShop = shop.replace(".myshopify.com", "");

    // Ensure MONTHLY_PLAN is defined
    if (typeof MONTHLY_PLAN === "undefined") {
      throw new Error("MONTHLY_PLAN is not defined");
    }

    // Check the billing requirements
    await billing.require({
      plans: [MONTHLY_PLAN],
      onFailure: async () => {
        // If the plan is not active, request the billing plan
        return await billing.request({
          plan: MONTHLY_PLAN,
          isTest: true,
          returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
        });
      },
    });

    return null; // If billing is active, no further action is required
  } catch (error) {
    console.error("Error in loader:", error);

    // Redirect or return an error page in case of failure
    return redirect("/error"); // Customize with your error page route
  }
};
