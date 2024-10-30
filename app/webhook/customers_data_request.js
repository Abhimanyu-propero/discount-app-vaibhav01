import withMiddleware from "../.server/middlewares/withMiddleware";


const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(401).send("Must be POST");
  }
  const { body } = req;
  const shop = req.body.shop_domain;
  console.log("webhook/customers_data_request", body, shop);
};

export default withMiddleware("verifyHmac")(handler);
