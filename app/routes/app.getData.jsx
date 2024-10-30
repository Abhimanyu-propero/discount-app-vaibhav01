import { json } from "@remix-run/node";
import shopify from "../shopify.server";

async function getCollectionAverage(collectionIds, admin) {
  const queries = collectionIds.map((collectionId, index) => `
      collection${index}: collection(id: "${collectionId}") {
        title
        products(first: 100) {
          nodes {
            id
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
      }
    `);

    const response = await admin.graphql(`
      query GetCollectionProducts {
        ${queries.join('\n')}
      }
    `);

    const responseData = await response.json();
    
    let allProducts = [];
    let allCollections = [];

    collectionIds.forEach((id, index) => {
      const collectionKey = `collection${index}`;
      const collection = responseData.data[collectionKey];
      allCollections.push(collection);
      const products = collection.products.nodes;
      allProducts = allProducts.concat(products);

      let totalPrices = 0;
      products.forEach(product => {
        if (product.variants.edges.length > 0) {
          totalPrices += parseFloat(product.variants.edges[0].node.price);
        }
      });

      collection.averagePrice = products.length > 0 ? (totalPrices / products.length).toFixed(2) : 0;
    });

    const totalPrices = allProducts.reduce((acc, product) => {
      if (product.variants.edges.length > 0) {
        return acc + parseFloat(product.variants.edges[0].node.price);
      }
      return acc;
    }, 0);

    const averagePrice = allProducts.length > 0 ? (totalPrices / allProducts.length) : 0;

    const data = Object({
      collections: allCollections,
      averagePrice: averagePrice.toFixed(2),
      products: allProducts
    });

    let titles = [];
    let averagePrices = [];

    for (let i of data.collections) {
      titles.push(i.title);
      averagePrices.push(i.averagePrice);
    }

    // const avgPriceObj = data.collections.reduce((acc, item) => {
    //   acc[item.title] = Number(item.averagePrice);
    //   return acc;
    // }, {});

    // return json({
    //   avgPrices: avgPriceObj
    // });

    const result = collectionIds.map((id, index) => {
      return {
          id: id,
          name: titles[index],
          // "Discounted Pricing (Per Unit)": averagePrices[index],
          // "Initial Pricing (Per Unit)": averagePrices[index]
          "Discounted Average Price": averagePrices[index],
          "Initial Average Price": averagePrices[index]
      };
    });

    return json({
      avgPrices: result
    })
  }

async function getInventoryData(productIds, admin) {

}

async function getProductUnitPriceNewVersion(productIds, admin) {
  const queries = productIds.map((productId, index) => `
      product${index}: product(id: "${productId}") {
        handle
        title
        totalInventory
        variants(first: 100) {
          edges {
            node {
              price
              inventoryItem {
                id
                unitCost {
                  amount
                }
              }
            }
          }
        }
      }
    `);

    const response = await admin.graphql(`
      query GetCollectionProducts {
        ${queries.join('\n')}
      }
    `);

    const responseData = await response.json();

    // old version
    let inventoryIds = [];
    // new summer edition 2024
    let productUnitCosts = [];
    let productTitles = [];

    // for older version
    // for ([key, _data] of Object.entries(responseData.data)) {
    //   inventoryIds.push(_data.variants.edges[0].node.inventoryItem.id)
    // }

    // new summer edition 2024
    for ([key, _data] of Object.entries(responseData.data)) {
      try{
        productUnitCosts.push(_data.variants.edges[0].node.inventoryItem.unitCost.amount);
      } catch(TypeError) {
        productUnitCosts.push(0);
      }
    }

    for ([key, _data] of Object.entries(responseData.data)) {
      productTitles.push(_data.title)
    }

    // for older version
    // return [inventoryIds, productTitles];

    // new summer edition 2024
    const productsUnitPrices = productTitles.reduce((acc, key, index) => {
      acc[key] = productUnitCosts[index];
      return acc;
    }, {});


    // return json({
    //   productUnitPrices: productsUnitPrices
    // });

    const result = productIds.map((id, index) => {
      return {
          id: id,
          name: productTitles[index],
          "Discounted Pricing (Per Unit)": productUnitCosts[index],
          "Initial Pricing (Per Unit)": productUnitCosts[index]
      };
    });

    return json({
      productUnitPrices: result
    });
}

async function getVariantPrice(variantId, admin) {
  // const queries = variantIds.map((variantId, index) => `
      // productVariant${index}: productVariant(id: "${variantId}") {
      //   displayName
      //   price
      // }
  //   }`
  // );
  const response = await admin.graphql(`
  query GetVariantDetails {
    productVariant(id: "${variantId}") {
        displayName
        price
      }
    }`
  );

  const responseData = await response.json();

  return responseData;
}

async function getAllVariantsInfo(variantIds, admin) {
  let variantsInfo = [];
  for (let id of variantIds) {
    const variantInfo = await getVariantPrice(id, admin);
    variantsInfo.push(variantInfo.data);
  }
  // const variantsInfo = await getVariantPrice(variantIds[0], admin)

  return json({
    productPrices: variantsInfo
  });
}

async function getProductsPrice(productIds, admin) {
  const queries = productIds.map((productId, index) => `
      product${index}: product(id: "${productId}") {
        handle
        title
        totalInventory
        variants(first: 100) {
          edges {
            node {
              price
              inventoryItem {
                id
                unitCost {
                  amount
                }
              }
            }
          }
        }
      }
    `);

    const response = await admin.graphql(`
      query GetCollectionProducts {
        ${queries.join('\n')}
      }
    `);

    const responseData = await response.json();

    // old version
    // let inventoryIds = [];

    // new summer edition 2024
    let productPrices = [];
    let productTitles = [];

    // for older version
    // for ([key, _data] of Object.entries(responseData.data)) {
    //   inventoryIds.push(_data.variants.edges[0].node.inventoryItem.id)
    // }

    // new summer edition 2024
    for ([key, _data] of Object.entries(responseData.data)) {
      try{
        productPrices.push(calculateAveragePrice(_data));
      } catch(TypeError) {
        productPrices.push(0);
      }
    }

    for ([key, _data] of Object.entries(responseData.data)) {
      productTitles.push(_data.title);
    }

    // for older version
    // return [inventoryIds, productTitles];

    // new summer edition 2024
    const productsUnitPrices = productTitles.reduce((acc, key, index) => {
      acc[key] = productPrices[index];
      return acc;
    }, {});


    // return json({
    //   productUnitPrices: productsUnitPrices
    // });

    const result = productIds.map((id, index) => {
      return {
          id: id,
          name: productTitles[index],
          "Discounted Pricing (Per Unit)": productPrices[index],
          "Initial Pricing (Per Unit)": productPrices[index]
      };
    });

    return json({
      productPrices: result
    });
}

function calculateAveragePrice(product) {
  const variants = product.variants.edges;
  const prices = variants.map(variant => parseFloat(variant.node.price));
  const total = prices.reduce((sum, price) => sum + price, 0);
  return prices.length > 0 ? total / prices.length : 0;
}

// older version
async function getProductUnitPrice(productIds, admin) {
  let invData = await getInventoryData(productIds, admin);
  const queries = invData[0].map((invId, index) => `
    inventoryItem${index}: inventoryItem(id: "${invId}") {
      id
      unitCost{
        amount
      }
    }`
  );

  const response = await admin.graphql(`
    query GetCollectionProducts {
      ${queries.join('\n')}
    }
  `);

  const responseData = await response.json();

  let unitPrices = [];

  for ([key, _data] of Object.entries(responseData.data)) {
    try {
    unitPrices.push(_data.unitCost.amount)
    } catch(TypeError) {
      unitPrices.push(0);
    }
  }

  const productsUnitPrices = invData[1].reduce((acc, key, index) => {
    acc[key] = unitPrices[index];
    return acc;
  }, {});

  return json({
    productUnitPrices: productsUnitPrices
  });
}

async function getProductsAveragePrice(resources) {
  let results = [];

  for (let i of resources) {
      let tempPrice = [];
      for (let j of i.variants) {
          tempPrice.push(parseFloat(j.price));
      }
      const sum = tempPrice.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      const avg = sum / tempPrice.length;

      results.push({
          id: i.id,
          name: i.title,
          "Discounted Pricing (Per Unit)": avg,
          "Initial Pricing (Per Unit)": avg
      });
  }
  return json({
    productPrices: results
  });
}

export async function action({ request }) {
  const { ids, queryType } = await request.json();
  const { admin } = await shopify.authenticate.admin(request);
  const _request = await request;

  if (queryType === "collection") {
    return getCollectionAverage(ids, admin);
  } else if (queryType === "product") {
    // older version
    // return getProductUnitPrice(ids, admin);
    // new summer edition 2024
    // return getProductsPrice(ids, admin);
    // return getVariantPrice(ids, admin);
    // return getAllVariantsInfo(ids, admin);
    return getProductsAveragePrice(_request);
  }
}
