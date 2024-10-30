// If you have the recommended extension installed, create a new page and type `createproxy` to generate proxy route boilerplate

import clientProvider from "../.server/clientProvider";
import withMiddleware from "../.server/middlewares/withMiddleware";

const handler = async (req, res) => {
  const { client } = await clientProvider.offline.graphqlClient({
    shop: req.user_shop,
  });

  return res.status(200).send({ content: "Proxy Be Working" });
};

export default withMiddleware("verifyProxy")(handler);
