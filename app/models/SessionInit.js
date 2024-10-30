import prisma from "../db.server"

export const CheckSession = async (admin, session) => {
    const shopData = await getShopInfo(admin);
    let shopRecord = null;
    shopRecord = await prisma.shopRecords.findFirst({
        where: {
            shopId: shopData.shop.Id
        }
    });

    // console.log("isPresent 1st:", isPresent);

    if (!shopRecord) {
        const trialEndDate =  new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        shopRecord = await prisma.shopRecords.create({
            data: {
                shop: session.shop,
                shopId: shopData.shop.id,
                subscriptionType: "trial",
                trialEndDate: trialEndDate,
                installationTime: new Date()
            }
        })
    }
    return shopRecord;
}

const getShopInfo = async (admin) => {
    const response = await admin.graphql(`{
        shop {
          id
        }
      }`)
    const parsedResponse = await response.json();
    return parsedResponse.data;
}
