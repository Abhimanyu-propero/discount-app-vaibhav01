export const deleteDiscount = async (data, admin) => {
    const discountIDs = data.DiscountsID?.map((discount) => discount.id) || [];
    if (discountIDs?.length > 0) {
    for (let i = 0; i < discountIDs.length; i++) {
      const response = await admin.graphql(
        `#graphql
        mutation discountAutomaticDelete($id: ID!) {
          discountAutomaticDelete(id: $id) {
            deletedAutomaticDiscountId
            userErrors {
              field
              code
              message
            }
          }
        }`,
        {
          variables: {
            "id": discountIDs[ i ],
          },
        },
      );

      await response.json();
    }
  }
}