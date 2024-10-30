import { RequestedTokenType } from "@shopify/shopify-api";
import prisma from "../prisma";
import sessionHandler from "../sessionHandler";
import shopify from "../shopify";
import freshInstall from "./freshInstall";
import verifyRequest from "./verifyRequest";

const isInitialLoad = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "";
    const idToken = url.searchParams.get("id_token");

    if (idToken && shop) {
      return await handleTokenExchange(idToken, shop);
    } else {
      return await handleExistingSession(request);
    }
  } catch (e) {
    return handleError(e);
  }
};

async function handleTokenExchange(idToken, shop) {
  const { session: offlineSession } = await shopify.auth.tokenExchange({
    sessionToken: idToken,
    shop,
    requestedTokenType: RequestedTokenType.OfflineAccessToken,
  });

  const { session: onlineSession } = await shopify.auth.tokenExchange({
    sessionToken: idToken,
    shop,
    requestedTokenType: RequestedTokenType.OnlineAccessToken,
  });

  await sessionHandler.storeSession(offlineSession);
  await sessionHandler.storeSession(onlineSession);

  await checkAndHandleFreshInstall(onlineSession.shop);

  return { shop: onlineSession.shop, session: onlineSession };
}

async function checkAndHandleFreshInstall(shop) {
  const storeRecord = await prisma.stores.findFirst({
    where: { shop },
  });

  if (!storeRecord || storeRecord.isActive === false) {
    await freshInstall({ shop });
  }
}

async function handleExistingSession(request) {
  const { shop, session: onlineSession } = await verifyRequest(request);
  return { shop, session: onlineSession };
}

function handleError(e) {
  if (
    e?.message?.includes("Failed to parse session token") 
  ) {
    return { shop: "", session: "" };
  } else {
    console.error(`Error in isInitialLoad: ${e.message}`, e);
    throw e; // Re-throw the error for upstream handling
  }
}

export default isInitialLoad;