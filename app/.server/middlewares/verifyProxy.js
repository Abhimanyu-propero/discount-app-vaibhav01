import { json } from "@remix-run/react";
import crypto from "crypto";

const verifyProxy = async (request) => {
  const { searchParams } = new URL(request.url);
  const signature = searchParams.get("signature");
  const shop = searchParams.get("shop");

  const queryURI = encodeQueryData(Object.fromEntries(searchParams))
    .replace("/?", "")
    .replace(/&signature=[^&]*/, "")
    .split("&")
    .map((x) => decodeURIComponent(x))
    .sort()
    .join("");

  const calculatedSignature = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(queryURI, "utf-8")
    .digest("hex");

  if (calculatedSignature === signature) {
    return { shop: shop || "" };
  } else {
    throw json(
      {
        success: false,
        message: "Signature verification failed",
      },
      { status: 401 }
    );
  }
};


function encodeQueryData(data) {
  const queryString = [];
  for (let d in data) queryString.push(d + "=" + encodeURIComponent(data[d]));
  return queryString.join("&");
}

export default verifyProxy;