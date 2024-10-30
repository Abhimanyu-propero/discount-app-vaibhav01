// //Do not use in production

// import { json } from "@remix-run/react";
// import crypto from "crypto";
// import shopify from "../../shopify.server";

// const verifyHmac = async (request) => {
//   try {
//     const generateHash = crypto
//       .createHmac("SHA256", process.env.SHOPIFY_API_SECRET)
//       .update(JSON.stringify(request.body), "utf8")
//       .digest("base64");

//     const hmac = request.headers["x-shopify-hmac-sha256"];

//     if (shopify.auth.safeCompare(generateHash, hmac)) {
//       //Move on
//     } else {
//       return json(
//         { success: false, message: "HMAC verification failed" },
//         { status: 401 }
//       );
//     }
//   } catch (e) {
//     return json(
//       { success: false, message: "HMAC verification failed" },
//       { status: 401 }
//     );
//   }
// };

// export default verifyHmac;

import { createHmac } from "crypto";
import { json } from "@remix-run/node";
import { shopify } from "~/shopify.server";

export async function verifyHmac(request, options = {}) {
  const { 
    secret = process.env.SHOPIFY_API_SECRET, 
    throwError = false 
  } = options;

  try {
    const body = await request.clone().text();
    const hmac = request.headers.get("x-shopify-hmac-sha256");

    if (!hmac) {
      throw new Error("No HMAC present in headers");
    }

    if (!secret) {
      throw new Error("No API secret provided");
    }

    const generateHash = createHmac("SHA256", secret)
      .update(body, "utf8")
      .digest("base64");

    const isValid = shopify.auth.safeCompare(generateHash, hmac);

    if (!isValid) {
      throw new Error("HMAC verification failed");
    }

    return true;
  } catch (error) {
    console.error("HMAC Verification Error:", error);

    if (throwError) {
      throw error;
    }

    return false;
  }
}

export function verifyWebhook(handler) {
  return async function verifiedHandler(args) {
    const isValid = await verifyHmac(args.request);

    if (!isValid) {
      return json(
        { success: false, message: "HMAC verification failed" },
        { status: 401 }
      );
    }

    return handler(args);
  };
}