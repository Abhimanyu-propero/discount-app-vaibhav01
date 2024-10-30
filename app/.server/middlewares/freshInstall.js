/**
 * Do not remove the Prisma query that upserts the shop to `true`.
 */
import prisma from "../../db.server";


const freshInstall = async ({ shop }) => {
  try {
      await prisma.stores.upsert({
      where: {
        shop: shop,
      },
      update: {
        shop: shop,
        isActive: true,
      },
      create: {
        shop: shop,
        isActive: true,
      },
    });

    //Other functions start here
  } catch (e) {
  }
};

export default freshInstall;