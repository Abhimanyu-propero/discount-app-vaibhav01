import clientProvider from "../../.server/clientProvider";
import withMiddleware from "../../.server/middlewares/withMiddleware";
import prisma from "../../db.server";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    //GET, POST, PUT, DELETE
    console.log("Serve this request only if method type is GET");
    return res.status(401).send({ error: true });
  }
  try {
    const applicationData = req.body;
    console.log(applicationData);
    const name = applicationData.name;
    const email = applicationData.email;
    const customer_id = applicationData.customer_id;
    delete applicationData.name;
    delete applicationData.email;
    delete applicationData.customer_id;

    const { client } = await clientProvider.offline.graphqlClient({
      shop: req.user_shop,
    });

    await client.query({
      data: {
        query: `mutation tagsAdd($id: ID!, $tags: [String!]!) {
                  tagsAdd(id: $id, tags: $tags) {
                    node {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`,
        variables: {
          id: `gid://shopify/Customer/${customer_id}`,
          tags: ["pending"],
        },
      },
    });

    await prisma.applications.upsert({
      where: {
        email: email,
      },
      update: {
        name: name,
        email: email,
        fields: applicationData,
        customer_id: customer_id,
      },
      create: {
        name: name,
        email: email,
        customer_id: customer_id,
        fields: applicationData,
      },
    });
    return res.status(200).send({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(401).send({ error: true });
  }
};

export default withMiddleware("verifyProxy")(handler);
