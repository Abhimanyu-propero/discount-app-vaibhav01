import withMiddleware from "../../.server/middlewares/withMiddleware";
import prisma from "../../db.server";

const handler = async (req, res) => {
  if (req.method !== "GET") {
    //GET, POST, PUT, DELETE
    console.log("Serve this request only if method type is GET");
    return res.status(401).send({ error: true });
  }
  try {
    const applicationForm = await prisma.applicationForm.findFirst();
    const fields = !applicationForm ? [] : JSON.parse(applicationForm?.fields);
    return res.status(200).send({ fields });
  } catch (e) {
    console.error(e);
    return res.status(401).send({ error: true });
  }
};

export default withMiddleware("verifyProxy")(handler);
