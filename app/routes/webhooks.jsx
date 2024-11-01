import { authenticate } from "../shopify.server";
import db from "../db.server";

import { createSubscriptionMetafield } from "../models/Subscription.server";

export const action = async ({ request }) => {
  const { billing,topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;
       case "APP_SUBSCRIPTIONS_UPDATE":
      if (payload.app_subscription.status == "ACTIVE") {
        createSubscriptionMetafield(admin.graphql, "true");
      } else {
        createSubscriptionMetafield(admin.graphql, "false");
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
      break;
    case "CUSTOMERS_REDACT":
      break;
    case "SHOP_REDACT":
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
