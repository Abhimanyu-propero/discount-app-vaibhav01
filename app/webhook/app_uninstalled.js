// app/routes/api/webhooks/app-uninstalled.js

import { json } from "@remix-run/node"; // Import json for response
import prisma from "../db.server"; // Adjust the path as necessary

export const action = async ({ request }) => {
  try {
    const { topic, shop, webhookRequestBody, webhookId, apiVersion } = await request.json();

    const webhookBody = JSON.parse(webhookRequestBody);

    // Delete sessions associated with the shop
    await prisma.session.deleteMany({ where: { shop } });

    // Upsert store information
    await prisma.stores.upsert({
      where: { shop: shop },
      update: { isActive: false },
      create: { shop: shop, isActive: false },
    });

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling app uninstallation:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};