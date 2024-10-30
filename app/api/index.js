import verifyRequest from "../.server/middlewares/verifyRequest";
import { json } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { session, shop } = await verifyRequest(request);
  return json({ message: "ok" });
};

export async function action({ request }) {
  const { session, shop } = await verifyRequest(request);
  const req = await request.json();
  console.dir({ req }, { depth: null });
  return json({ message: "ok" });
}