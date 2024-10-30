export const createDiscount = async (data, admin) => {

  const quant = data.offers?.map((offer) => offer.quantity);
  const disc = data.offers?.map((offer) => offer.discountAmount);
  const length = disc?.length;
  const productVariants = [];
  const collectionIds = [];
  data.products?.forEach(product => {
    product.variants.forEach(variant => {
      productVariants.push(variant.id)
    })
  });
  data.collections?.forEach(collection => {
    collectionIds.push(collection.id)
  });
  
  // console.log("Quantity: ", quant);
  // console.log("Discount: ", disc);
  // console.log("Offer Name: ", data.offerName);
  // console.log("Start Date: ", data.startDate);
  // console.log("End Date: ", data.endDate);
  // console.log("Discount on: ", data.type);
  // console.log("Offer Type: ", data.offerType);
  // console.log("Sub Discount: ", data.subDiscount);
  // console.log("Collection IDs: ", collectionIds);

  const Data = [];

  switch (data.type) {
    case "product":
      if (data.offerType === "volumeDiscount" && data.subDiscount === "percentage") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumQuantity{
                            greaterThanOrEqualToQuantity
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountPercentage{
                              percentage
                            }
                          }
                          items {
                            ... on DiscountProducts {
                              productVariants(first: 100){
                                nodes{
                                  id
                                }
                              }
                            }
      
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "quantity": {
                        "greaterThanOrEqualToQuantity": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "percentage": disc[ i ] * 0.01
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("Error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "volumeDiscount" && data.subDiscount === "amount") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumQuantity{
                            greaterThanOrEqualToQuantity
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountAmount {
                              amount {
                                amount
                                currencyCode
                              }
                              appliesOnEachItem
                            }
                          }
                          items {
                            ... on DiscountProducts {
                              productVariants(first: 100){
                                nodes{
                                  id
                                }
                              }
                            }
      
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "quantity": {
                        "greaterThanOrEqualToQuantity": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountAmount": {
                          "amount": disc[ i ],
                          "appliesOnEachItem": true
                        }
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("Error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "spendAmountDiscount" && data.subDiscount === "percentage") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumSubtotal {
                            greaterThanOrEqualToSubtotal {
                              amount
                              currencyCode
                            }
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountPercentage{
                              percentage
                            }
                          }
                          items {
                            ... on DiscountProducts {
                              productVariants(first: 100){
                                nodes{
                                  id
                                }
                              }
                            }
      
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "subtotal": {
                        "greaterThanOrEqualToSubtotal": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "percentage": disc[ i ] * 0.01
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "spendAmountDiscount" && data.subDiscount === "amount") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumSubtotal {
                            greaterThanOrEqualToSubtotal {
                              amount
                              currencyCode
                            }
                          }
                        }
                        customerGets {
                          value {
                             ... on DiscountAmount {
                                      amount {
                                        amount
                                        currencyCode
                                      }
                                      appliesOnEachItem
                                    }
                          }
                          items {
                            ... on DiscountProducts {
                              productVariants(first: 100){
                                nodes{
                                  id
                                }
                              }
                            }
      
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "subtotal": {
                        "greaterThanOrEqualToSubtotal": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountAmount": {
                          "amount": disc[ i ],
                          "appliesOnEachItem": true
                        }
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "buyXgetY" && data.subDiscount === "bXgY") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticBxgyCreate($automaticBxgyDiscount: DiscountAutomaticBxgyInput!) {
                discountAutomaticBxgyCreate(automaticBxgyDiscount: $automaticBxgyDiscount) {
                  automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBxgy {
                              startsAt
                              endsAt
                              status
                              summary
                              title
                              usesPerOrderLimit
                              customerBuys {
                                items {
                                  ... on DiscountProducts {
                                    products(first: 2) {
                                      nodes {
                                        id
                                      }
                                    }
                                  }
                                }
                                value {
                                  ... on DiscountQuantity {
                                    quantity
                                  }
                                }
                              }
                              customerGets {
                                items {
                                  ... on DiscountProducts {
                                    products(first: 2) {
                                      nodes {
                                        id
                                      }
                                    }
                                  }
                                }
                                value {
                                ... on DiscountOnQuantity {
                                    quantity {
                                      quantity
                                    }
                                  }
                                }
                              }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBxgyDiscount": {
                    "usesPerOrderLimit": "3",
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "customerBuys": {
                      "value": {
                        "quantity": quant[ i ]
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountOnQuantity": {
                          "quantity": disc[ i ],
                          "effect": {
                            "percentage": 1
                          }
                        }
                      },
                      "items": {
                        "products": {
                          "productVariantsToAdd": productVariants
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else {
        console.log("Offer type not specified on Products discount");
      }
      break;

    case "collection":
      if (data.offerType === "volumeDiscount" && data.subDiscount === "percentage") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnCollections($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumQuantity{
                            greaterThanOrEqualToQuantity
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountPercentage{
                              percentage
                            }
                          }
                          items {
                            ... on DiscountCollections {
                              collections(first: 100) {
                                nodes {
                                  id
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "quantity": {
                        "greaterThanOrEqualToQuantity": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "percentage": disc[ i ] * 0.01
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL Errors:", json.errors);
              json.errors.forEach(error => {
                console.error("Error Message:", error.message);
                console.error("Error Locations:", error.locations);
                console.error("Error Path:", error.path);
              });
            }
            if (json.data.discountAutomaticBasicCreate.userErrors.length > 0) {
              console.log("User Errors:", json.data.discountAutomaticBasicCreate.userErrors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "volumeDiscount" && data.subDiscount === "amount") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumQuantity{
                            greaterThanOrEqualToQuantity
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountAmount {
                              amount {
                                amount
                                currencyCode
                              }
                              appliesOnEachItem
                            }
                          }
                          items {
                            ... on DiscountCollections {
                              collections(first: 100) {
                                nodes {
                                  id
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "quantity": {
                        "greaterThanOrEqualToQuantity": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountAmount": {
                          "amount": disc[ i ],
                          "appliesOnEachItem": true
                        }
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("Error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "spendAmountDiscount" && data.subDiscount === "percentage") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumSubtotal {
                            greaterThanOrEqualToSubtotal {
                              amount
                              currencyCode
                            }
                          }
                        }
                        customerGets {
                          value {
                            ... on DiscountPercentage{
                              percentage
                            }
                          }
                          items {
                            ... on DiscountCollections {
                              collections(first: 100) {
                                nodes {
                                  id
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "subtotal": {
                        "greaterThanOrEqualToSubtotal": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "percentage": disc[ i ] * 0.01
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "spendAmountDiscount" && data.subDiscount === "amount") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticOnVariants($automaticBasicDiscount: DiscountAutomaticBasicInput!){
                discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
                automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBasic {
                        startsAt
                        endsAt
                        minimumRequirement {
                          ... on DiscountMinimumSubtotal {
                            greaterThanOrEqualToSubtotal {
                              amount
                              currencyCode
                            }
                          }
                        }
                        customerGets {
                          value {
                             ... on DiscountAmount {
                                      amount {
                                        amount
                                        currencyCode
                                      }
                                      appliesOnEachItem
                                    }
                          }
                          items {
                            ... on DiscountCollections {
                              collections(first: 100) {
                                nodes {
                                  id
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBasicDiscount": {
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "minimumRequirement": {
                      "subtotal": {
                        "greaterThanOrEqualToSubtotal": quant[ i ]
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountAmount": {
                          "amount": disc[ i ],
                          "appliesOnEachItem": true
                        }
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    }
                  }
                },
              },
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else if (data.offerType === "buyXgetY" && data.subDiscount === "bXgY") {
        for (let i = 0; i < length; i++) {
          try {
            const response = await admin.graphql(
              `#graphql
              mutation discountAutomaticBxgyCreate($automaticBxgyDiscount: DiscountAutomaticBxgyInput!) {
                discountAutomaticBxgyCreate(automaticBxgyDiscount: $automaticBxgyDiscount) {
                  automaticDiscountNode {
                    id
                    automaticDiscount {
                      ... on DiscountAutomaticBxgy {
                        startsAt
                        endsAt
                        status
                        summary
                        title
                        usesPerOrderLimit
                        customerBuys {
                          value {
                            ...on DiscountQuantity {
                              quantity
                            }
                          }
                          items {
                            ...on DiscountCollections{
                              collections(first: 20){
                                nodes{
                                  id
                                }
                              }
                            }
                          }
                        }
                        customerGets{
                          value{
                            ...on DiscountOnQuantity{
                              quantity{
                                quantity
                              }
                            }
                          }
                          items{
                            ...on DiscountCollections{
                              collections(first: 20){
                                nodes{
                                  id
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    code
                    message
                  }
                }
              }`,
              {
                variables: {
                  "automaticBxgyDiscount": {
                    "usesPerOrderLimit": "3",
                    "title": data.offerName + "_" + [ i ],
                    "startsAt": data.startDate,
                    "endsAt": data.endDate,
                    "customerBuys": {
                      "value": {
                        "quantity": quant[ i ]
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    },
                    "customerGets": {
                      "value": {
                        "discountOnQuantity": {
                          "quantity": disc[ i ],
                          "effect": {
                            "percentage": 1
                          }
                        }
                      },
                      "items": {
                        "collections": {
                          "add": collectionIds
                        }
                      }
                    }
                  }
                }
              }
            );

            const json = await response.json();
            if (json.errors) {
              console.log("GraphQL error", json.errors);
            }
            else {
              Data.push(json);
            }
          } catch (error) {
            console.error("Error creating discount:", error);
          }
        }
      }
      else {
        console.log("Offer type not specified on Collections discount");
      }
      break;

    default:
      console.log("Discount type not specified");
      break;
  }

  const extractedData = Data.map((response) => {
    let discountData;
    if (response.data.discountAutomaticBasicCreate !== undefined) {
      discountData = response.data.discountAutomaticBasicCreate;
    }
    else {
      discountData = response.data.discountAutomaticBxgyCreate
    }

    // Handle any user errors
    if (discountData.userErrors.length > 0) {
      return null;
    }

    // Destructure to get specific fields
    const {
      automaticDiscountNode: { id }
    } = discountData;

    return { id };
  }).filter(Boolean);

  if (extractedData.length <= 0) {
    return null;
  }
  return extractedData;
}