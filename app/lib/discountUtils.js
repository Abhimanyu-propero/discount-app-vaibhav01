export function getTotalDiscountedAmountBxGy(entities, offers, forCollection = false) {
  let totalDiscountedAmount = 0;

  entities.forEach(entity => {
      let priceToUse = forCollection ? entity.collectionAveragePrice : entity.price;
      let entityDiscount = 0;

      offers.forEach(offer => {
          const bought = Number(offer.quantity);
          const free = Number(offer.discountAmount);
          const totalItems = bought + free;
          const discountRatio = free / totalItems;
          const discountAmount = priceToUse * discountRatio;
          entityDiscount += discountAmount;
      });
      totalDiscountedAmount += entityDiscount;
  });

  return totalDiscountedAmount.toFixed(2);
}

export function calculateDiscountMarginBxGy(chartsData, discountedDataKey, initialDataKey) {
  const totalDiscountedPrice = chartsData.reduce((sum, product) => {
      return sum + parseFloat(product[discountedDataKey]);
  }, 0);

  const totalPrice = chartsData.reduce((sum, product) => {
      return sum + parseFloat(product[initialDataKey]);
  }, 0);

  const percentageMarginReduction = (totalDiscountedPrice / totalPrice) * 100;

  return percentageMarginReduction;
}

export const calculateDiscountedPrices = (products, values) => {
  const offers = values.offers || [];

  return products.map((product) => {
    const initialPrice = parseFloat(product["Initial Pricing (Per Unit)"]);

    let totalQuantity = 0;
    let totalDiscountedCost = 0;
    let buyXgetY = false;

    offers.forEach((offer) => {
      if (offer && offer.quantity && offer.discountAmount) {
        const offerQuantity = parseFloat(offer.quantity); // X (Bought)
        const offerDiscountAmount = parseFloat(offer.discountAmount); // Y (Free)
        let offerDiscountedPrice;

        switch (offer.subDiscount || values.subDiscount) {
          case "amount":
            offerDiscountedPrice = initialPrice - offerDiscountAmount;
            break;
          case "each":
            offerDiscountedPrice = offerDiscountAmount;
            break;
          case "percentage":
            offerDiscountedPrice = initialPrice * (1 - offerDiscountAmount / 100);
            break;
          case "bXgY":
            buyXgetY = true;
            const totalItems = offerQuantity + offerDiscountAmount;
            offerDiscountedPrice = (initialPrice * offerQuantity) / totalItems; 
            console.log("offerDiscountedPrice:", offerDiscountedPrice);
            totalDiscountedCost += offerDiscountedPrice * totalItems;
            totalQuantity += totalItems;
            break;
          default:
            offerDiscountedPrice = initialPrice;
            break;
        }
        if ((offer.subDiscount || values.subDiscount) !== "bXgY") {
          totalQuantity += offerQuantity;
          totalDiscountedCost += offerQuantity * offerDiscountedPrice;
        }
      }
    });
    let discountedPrice;
    if (buyXgetY) {
      discountedPrice = totalDiscountedCost / totalQuantity;
    } else {
      discountedPrice = totalQuantity > 0 ? totalDiscountedCost / totalQuantity : initialPrice;
    }

    return {
      ...product,
      "Discounted Pricing (Per Unit)": discountedPrice.toFixed(2),
    };
  });
};

export const calculateDiscountedAveragePrices = (collections, values) => {
  console.log("discounting collections");
  const offers = values.offers || [];

  return collections.map((collection) => {
    const initialPrice = parseFloat(collection[ "Initial Average Price" ]);

    let totalQuantity = 0;
    let totalDiscountedCost = 0;
    let buyXgetY = false;

    offers.forEach((offer) => {
      if (offer && offer.quantity && offer.discountAmount) {
        const offerQuantity = parseFloat(offer.quantity);
        const offerDiscountAmount = parseFloat(offer.discountAmount);
        let offerDiscountedPrice;

        switch (offer.subDiscount || values.subDiscount) {
          case "amount":
            offerDiscountedPrice = initialPrice - offerDiscountAmount;
            break;
          case "each":
            offerDiscountedPrice = offerDiscountAmount;
            break;
          case "percentage":
            offerDiscountedPrice = initialPrice * (1 - offerDiscountAmount / 100);
            break;
            case "bXgY":
              offerDiscountedPrice = initialPrice * offerDiscountAmount;
              buyXgetY = true;
          default:
            offerDiscountedPrice = initialPrice;
            break;
        }

        totalQuantity += offerQuantity;
        if ((offer.subDiscount || values.subDiscount) === "buyXgetY") {
          totalDiscountedCost += offerDiscountedPrice;
        } else {
          totalDiscountedCost += offerQuantity * offerDiscountedPrice;
        }
      }
    });

    let discountedPrice;

    if (buyXgetY) {
      discountedPrice = totalDiscountedCost;
    } else {
      discountedPrice = totalQuantity > 0 ? totalDiscountedCost / totalQuantity : initialPrice;
    }

    return {
      ...collection,
      "Discounted Average Price": discountedPrice.toFixed(2),
    };
  });
};

export const formatDataForChart = (products = [], collections = [], formState) => {
  if (products?.length > 0) {
    const ProductsList = products.map((product) => {
      return {
        id: product.id,
        name: product.title,
        "Initial Pricing (Per Unit)": product.price,
      }
    });
    return calculateDiscountedPrices(ProductsList, formState);
  }
  if (collections?.length > 0) {
    const CollectionsList = collections.map((collection) => {
      return {
        id: collection.id,
        name: collection.title,
        "Initial Average Price": collection.collectionAveragePrice,
      }
    });
    return calculateDiscountedAveragePrices(CollectionsList, formState);
  }
}

export const validateForm = (data) => {
  const newErrors = {};

  // Check for empty fields
  if (!data.offerName) newErrors.offerName = 'Offer Name is required.';
  if (!data.offerType) newErrors.offerType = 'Offer Type is required.';
  // if (!data.products.length < 1) newErrors.products = 'Products/Collections are required.';
  // if (!data.offers.length < 1) newErrors.offers = 'Offers are required.';
  if (!data.startDate) newErrors.startDate = 'Start date is required.';
  if (!data.endDate) newErrors.endDate = 'End date is required.';

  // Add more validations as needed (e.g., check for valid dates, number ranges, etc.)
  return newErrors;
};

export const selectProduct = async (formState, setFormState) => {
  let selectedIdsBaseResource = [];

  if (formState.listProductIds?.length > 0) {
    selectedIdsBaseResource = formState.listProductIds;
  }

  console.log("selectedIdsBaseResource:", selectedIdsBaseResource);

  const productsList = await window.shopify.resourcePicker({
    type: "product",
    action: "select",
    multiple: true,
    selectionIds: selectedIdsBaseResource,
  });

  // console.log("Selected Products List:", productsList);

  let products = productsList.map((product) => {
    // Extracting the base properties for each product
    const { id, title, variants, images } = product;

    // Extract the image URL
    const imageUrl = (images && images.length > 0) ? images[ 0 ]?.originalSrc : '';

    // Mapping over variants to extract the necessary properties
    const newVariants = variants.map(variant => {
      return {
        id: variant.id,
        title: variant.title,
        price: variant.price
      };
    });

    // Calculating average price
    const prices = newVariants.map(variant => parseFloat(variant.price));
    let averagePrice = 0;
    if (prices.length > 1) {
      const totalPrices = prices.reduce((sum, price) => sum + price, 0);
      averagePrice = (totalPrices / prices.length).toFixed(2);
    } else if (prices.length === 1) {
      averagePrice = prices[ 0 ].toFixed(2);
    }

    return {
      id,
      title,
      imageUrl,
      price: averagePrice, // Set the average price
      variants: newVariants
    };
  });

  // If formState.products exists, filter out any products with duplicate IDs
  if (formState.products) {
    const existingProductIds = formState.products.map(product => product.id);
    products = products.filter(product => !existingProductIds.includes(product.id));
    products = [ ...formState.products, ...products ];
  }

  // console.log("products:", products);

  const productIdsBaseResource = products.map(({ id }) => id);
  const updatedData = formatDataForChart(products, [], formState);

  setFormState({
    ...formState,
    type: "product",
    listProductIds: productIdsBaseResource,
    products: products,
    chartData: updatedData,
    disableCollectionButton: true,
    initialDataKey: "Initial Pricing (Per Unit)",
    discountedDataKey: "Discounted Pricing (Per Unit)",

  });
}
export const handleRemoveProduct = (productId, formState, setFormState) => {
  let Type = "product";
  const updatedProducts = formState.products.filter(
    (product) => product.id !== productId,
  );

  const updatedFormattedData =
    updatedProducts.length > 0
      ? formState.chartData.filter((data) => data.id !== productId)
      : [];

  const updatedData =
    updatedFormattedData.length > 0
      ? calculateDiscountedPrices(updatedFormattedData, formState)
      : [];

  if (!updatedFormattedData.length > 0) {
    Type = "";
  }

  const updatedProductIds = updatedProducts.map(product => ({ id: product.id }));

  setFormState({
    ...formState,
    listProductIds: updatedProductIds,
    products: updatedProducts,
    chartData: updatedData,
    type: Type
  });
};

async function getDataFromIds(ids, qType) {
  const response = await fetch("../getData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        ids: ids,
        queryType: qType
      }
    ),
  });

  const data = await response.json();
  if (qType === "collection") {
    return data.avgPrices;
  } else if (qType === "product") {
    return data.productPrices;
  }
}

export const selectCollection = async (formState, setFormState) => {
  let collectionIds = [];

  let selectedIdsBaseResource = [];
  if (formState.listCollectionIds) {
    if (formState.listCollectionIds.length > 0) {
      selectedIdsBaseResource = formState.listCollectionIds;
    }
  }

  const collectionsList = await window.shopify.resourcePicker({
    type: "collection",
    action: "select",
    multiple: true,
    selectionIds: selectedIdsBaseResource
  });

  // console.log("Selected Collections List:", collectionsList);

  let collections = collectionsList.map((collection) => {
    return {
      id: collection.id,
      title: collection.title
    };
  });

  // If formState.collections exists, filter out any collections with duplicate IDs
  if (formState.collections) {
    const existingCollectionIds = formState.collections.map(collection => collection.id);
    collections = collections.filter(collection => !existingCollectionIds.includes(collection.id));
    collections = [ ...formState.collections, ...collections ];
  }

  collectionIds = collections.map((collection) => collection.id);
  const collectionsData = await getDataFromIds(collectionIds, "collection");

  // Map the fetched data to include 'collectionAveragePrice' in the original collections array
  collections = collections.map((collection) => {
    // Find the corresponding data from collectionsData using the collection id
    const data = collectionsData.find(data => data.id === collection.id);

    // Calculate the average price and construct the final collection object
    const collectionAveragePrice = data ? parseFloat(data[ "Initial Average Price" ]) : 0;

    return {
      id: collection.id,
      title: collection.title,
      collectionAveragePrice: collectionAveragePrice
    };
  });

  console.log("Selected Collections:", collections);

  const collectionIdsBaseResource = collectionIds.map(id => ({ id }));
  const updatedData = formatDataForChart([], collections, formState);

  console.log("Collections Data:", collectionsData);
  console.log("Collection Ids Base Resource:", collectionIdsBaseResource);
  console.log("Updated Data:", updatedData);

  setFormState({
    ...formState,
    type: "collection",
    collections: collections,
    collectionIds: JSON.stringify(collectionIds),
    listCollectionIds: collectionIdsBaseResource,
    chartData: updatedData,
    initialDataKey: "Initial Average Price",
    discountedDataKey: "Discounted Average Price",
  });
}

export const handleRemoveCollection = (collectionId, formState, setFormState) => {
  let Type = "collection";
  const updatedCollections = formState.collections.filter(
    (collection) => collection.id !== collectionId,
  );

  const updatedFormattedData =
    updatedCollections.length > 0
      ? formState.chartData.filter((data) => data.id !== collectionId)
      : [];

  const updatedData =
    updatedFormattedData.length > 0
      ? calculateDiscountedPrices(updatedFormattedData, formState)
      : [];
  if (!updatedFormattedData.length > 0) {
    Type = "";
  }

  const updatedCollectionIds = updatedCollections.map(collection => ({ id: collection.id }));

  setFormState({
    ...formState,
    collections: updatedCollections,
    listCollectionIds: updatedCollectionIds,
    chartData: updatedData,
    type: Type
  });
}

export const handleAddOffer = (maxOffers, formState, setFormState) => {
  if (formState.offers?.length < maxOffers) {
    const newOffer = {
      quantity: "",
      discountAmount: "",
    };
    const updatedOffers = [ ...formState.offers, newOffer ];
    setFormState({ ...formState, offers: updatedOffers });
    console.log("Offer added:", updatedOffers);
    console.log("subdiscount:", formState.subDiscount);
  }
};

export const handleRemoveOffer = (index, formState, setFormState) => {
  const updatedOffers = [ ...formState.offers ];
  updatedOffers.splice(index, 1);
  setFormState({ ...formState, offers: updatedOffers });
  console.log("Offer removed:", updatedOffers);
};

export const handleOfferFieldChange = (index, field, value, formState, setFormState) => {
  if (parseFloat(value) >= 0 || value === "") {
    const updatedOffers = formState.offers.map((offer, i) => {
      if (i === index) {
        return { ...offer, [ field ]: value };
      }
      return offer;
    });
    setFormState({ ...formState, offers: updatedOffers });
    console.log("Offer field changed:", updatedOffers);
  }
};
