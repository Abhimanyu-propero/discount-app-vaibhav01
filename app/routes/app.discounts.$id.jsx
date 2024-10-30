import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit, } from "@remix-run/react";
import { BlockStack, Button, Card, FormLayout, Grid, Icon, InlineStack, LegacyStack, Page, PageActions, RadioButton, Select, Tag, Text, TextField, Thumbnail, Banner } from "@shopify/polaris";
import { MinusCircleIcon } from "@shopify/polaris-icons";
import React, { useCallback, useEffect, useState } from "react";
import VisualPanal from "../components/visualPanal";
import db from "../db.server";
import getSymbolFromCurrency from 'currency-symbol-map'
import { createDiscount } from "../lib/createDiscount";
import { deleteDiscount } from "../lib/deleteDiscount";
import {
  calculateDiscountedAveragePrices,
  calculateDiscountedPrices,
  formatDataForChart,
  handleAddOffer,
  handleOfferFieldChange,
  handleRemoveCollection,
  handleRemoveOffer,
  handleRemoveProduct,
  selectCollection,
  selectProduct,
  validateForm,
} from "../lib/discountUtils";
import { CheckSession } from "../models/SessionInit";
import { getDiscountTable } from "../models/discounts.server";
import { authenticate } from "../shopify.server";
import { addDays, isBefore } from 'date-fns';

async function getCurrencySymbol(admin) {
  const response = await admin.graphql(`{
    shop {
      currencyCode
    }
  }`);
  const parsedResponse = await response.json();
  const currency = parsedResponse.data.shop.currencyCode;
  const currencySymbol = getSymbolFromCurrency(currency);

  return currencySymbol;
}

const getStoreSubInfo = async (admin, session) => {
  const checkTrial = await CheckSession(admin, session);
  const dateNow = new Date();
  if (checkTrial.subscriptionType === "free") {
    const trialEndDate = addDays(new Date(checkTrial.subStartDate), 6);

    const isTrialActive = isBefore(dateNow, addDays(trialEndDate, 1));

    // console.log("Trial End Date:", trialEndDate);
    // console.log("Current Date:", dateNow);
    // console.log("Is Trial Active:", isTrialActive);
    return isTrialActive;
  }
  else if (checkTrial.subscriptionType === "expired") {
    return false;
  }
  else {
    return checkTrial.subscriptionType;
  }
}

export async function loader({ params, request }) {
  const { admin, session } = await authenticate.admin(request);
  const currencySymbol = await getCurrencySymbol(admin);
  const subActive = await getStoreSubInfo(admin, session);
  // console.log("Subscription Active:", subActive);

  // const url = new URL(request.url);
  // const shopUrl = url.origin;
  // const shopDomain = url.searchParams.get("shop");
  const envData = process.env;
  // // const scopes = "read_orders";
  // // const redirectUri = `${shopDomain}/auth/callback`;
  const orders = await admin.rest.resources.Order.all({
    limit: 100,
    session: session,
    status: "any",
  });
  // const fulfilledOrders = orders.data.filter(obj => obj.fulfillment_status !== null);
  const totalSales = orders.data.reduce((acc, order) => acc + Number(order.current_subtotal_price), 0);
  const totalDiscount = orders.data.reduce((acc, order) => acc + Number(order.current_total_discounts), 0);
  const aov = ((totalSales - totalDiscount) / orders.data.length).toFixed(2);
  if (params.id === "new") {
    return json({
      offerName: "",
      offerType: "",
      subDiscount: "",
      offers: [],
      products: [],
      collections: [],
      chartData: [],
      currencySymbol: currencySymbol,
      envData: envData,
      subActive: subActive,
      // shopDomain: shopDomain,
      // url: url,
      // shopUrl: shopUrl,
      // authUrl: `https://${shopUrl}/admin/oauth/authorize?client_id=${envData.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`,
      orders: orders,
      aov: aov
    });
  }
  const id = params.id;
  let updatedChart = [];
  let discountTable = await getDiscountTable(id);
  if (discountTable === null || discountTable === undefined) {
    return redirect("/app");
  }
  if (discountTable.products?.length > 0) {
    updatedChart = formatDataForChart(discountTable.products, [], discountTable);
  }
  if (discountTable.collections?.length > 0) {
    updatedChart = formatDataForChart([], discountTable.collections, discountTable);
  }
  discountTable = { ...discountTable, chartData: updatedChart, subActive: subActive };
  return json(discountTable);
}

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();

  const id = params.id;

  const action = formData.get("action");
  const DiscountsID = JSON.parse(formData.get("discountsID"));
  
  if (action === "delete" && id !== null) {
    const Data1 = {
      DiscountsID
    };
    await deleteDiscount(Data1, admin);

    try {
      // console.log("Delete discount: ", id);
      await db.discountTable.delete({ where: { id } });
      return redirect(`/app`);
    } catch (error) {
      console.log("Error deleting discount: ", error);
      return redirect(`/app`);
    }
  }
  
  const data = {
    shop: shop,
    offerName: formData.get('offerName'),
    offerType: formData.get('offerType'),
    type: formData.get('type'),
    subDiscount: formData.get('subDiscount'),
    discountedAmount: parseFloat(formData.get('discountedAmount')), // Convert discountedAmount to a float
    startDate: new Date(formData.get('startDate')), // Convert startDate to Date object
    endDate: new Date(formData.get('endDate')),     // Convert endDate to Date object
    offers: JSON.parse(formData.get('offers')),     // Parse JSON string to an object
    chartData: JSON.parse(formData.get('chartData')) // Parse JSON string to an object
  };

  const products = formData.get("products");
  const collections = formData.get("collections");
  if (products) {
    data.products = JSON.parse(products);
  }
  if (collections) {
    data.collections = JSON.parse(collections);
  }
  
  // Create discount
  const response = await createDiscount(data, admin);

  if (!response || response === null || response.length === 0) {
    console.log("Error creating discount");
    return json({ error: "Error creating discount" });
  }
  
  //vv important for delete
  //do not remove
  //what it does?
  //we dont know, but it does!!!
  // we are, you are, everyone is. lets accept out fate and move on
  // jai hind jai bharat
  data.discountsID = response;
  await db.discountTable.create({ data })

  return redirect(`/app`);
}

export default function DiscountForm() {
  let actionErrors = useActionData()?.error || null;
  const discounts = useLoaderData();

  const navigate = useNavigate();
  const nav = useNavigation();

  const [ formState, setFormState ] = useState(
    {
      ...discounts,
      renderTable: true
    }
  );
  const [ cleanFormState, setCleanFormState ] = useState(discounts);
  const [ errors, setErrors ] = useState({});
  const submit = useSubmit();

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const handlesubDiscountChange = (type) => {
    setFormState({ ...formState, subDiscount: type });
  };

  const maxOffers = 5;

  useEffect(() => {
    let updatedChartData = [];
    let totalDiscountedQty = 0;
    let SubDiscount = formState.subDiscount;
    // let totalDiscountedAmount = 0; // New variable for total discounted amount

    // Can change this if block to call formatDataForChart
    if (formState.chartData && formState.chartData.length > 0) {
      if (formState.type === "product") {
        updatedChartData = calculateDiscountedPrices(
          formState.chartData,
          formState
        );
      } else if (formState.type === "collection") {
        updatedChartData = calculateDiscountedAveragePrices(
          formState.chartData,
          formState
        );
      }
    } else {
      updatedChartData = [];
    }

    if (formState.offers.length !== 0) {
      totalDiscountedQty = formState.offers.reduce((sum, offer) => {
        const quantity = parseInt(offer.quantity, 10);
        return sum + (isNaN(quantity) ? 0 : quantity);
      }, 0);
    }
    // if (formState.offers.length === 0) {
    //   SubDiscount = "";
    // }

    setFormState((prevState) => ({
      ...prevState,
      chartData: updatedChartData,
      totalDiscountedQty: totalDiscountedQty,
      subDiscount: SubDiscount,
      // totalDiscountedAmount: totalDiscountedAmount, // Save total discounted amount in state
    }));
  }, [
    formState.offers,
    formState.subDiscount,
    formState.collections,
    formState.products,
  ]);

  useEffect(() => {
    if (!formState.subActive) navigate("/app/pricing");
    let selectedIdsBaseResource = [];
    let initData = "";
    let disData = "";
    if (formState.products?.length > 0) {
      selectedIdsBaseResource = formState.products.map((product) => product.id);
      initData = "Initial Pricing (Per Unit)";
      disData = "Discounted Pricing (Per Unit)";
      // console.log("Selected Products IDs useEffect 2:", selectedIdsBaseResource);
    }

    if (formState.collections?.length > 0) {
      selectedIdsBaseResource = formState.collections.map((collection) => collection.id);
      initData = "Initial Average Price";
      disData = "Discounted Average Price";
      // console.log("Selected Collections IDs useEffect 2:", selectedIdsBaseResource);
    }
    setFormState((prevState) => ({
      ...prevState,
      listProductIds: selectedIdsBaseResource,
      initialDataKey: initData,
      discountedDataKey: disData,
    }));
  }, [])


  if (Object.keys(errors).length > 0 || actionErrors !== null) {
    setTimeout(() => {
      setErrors({});
      actionErrors = null;
    }, 3000);
  }

  const getQuantityPlaceholder = (offerType) => {
    switch (offerType) {
      case "volumeDiscount":
        return "Quantity";
      case "spendAmountDiscount":
        return "Cart Value";
      case "buyXgetY":
        return "Buy QTY";
      default:
        return "Quantity";
    }
  }

  const getDiscountPlaceholder = (subDiscount) => {
    switch (subDiscount) {
      case "percentage":
        return "Discount %";
      case "amount":
        return "Discount Rs.";
      case "bXgY":
        return "Get QTY";
      default:
        return "Discount %";
    }
  }

  const renderOfferRows = () => {
    const quantityPlaceholder = getQuantityPlaceholder(formState.offerType);
    const discountPlaceholder = getDiscountPlaceholder(formState.subDiscount);

    return formState.offers.map((offer, index) => (
      <div key={index} style={{ marginTop: "10px", marginBottom: "10px" }}>
        <FormLayout.Group condensed>
          <TextField
            type="number"
            value={offer.quantity}
            placeholder={quantityPlaceholder}
            disabled = {Boolean(discounts.id)}
            onChange={(value) =>
              handleOfferFieldChange(index, "quantity", value, formState, setFormState)
            }
          />
          <TextField
            type="number"
            value={offer.discountAmount}
            disabled = {Boolean(discounts.id)}
            placeholder={discountPlaceholder}
            onChange={(value) =>
              handleOfferFieldChange(index, "discountAmount", value, formState, setFormState)
            }
          />

          <Button disabled = {Boolean(discounts.id)} onClick={() => handleRemoveOffer(index, formState, setFormState)}>
            <Icon source={MinusCircleIcon} />
          </Button>
        </FormLayout.Group>
      </div>
    ));
  };

  function renderDiscountExample(value) {
    switch (value) {
      case "volumeDiscount":
        return (
          <ul>
            <li>Buy 5 or more - get 10% Off</li>
            <li>Buy 10 or more - get 20% Off</li>
          </ul>
        );
      case "spendAmountDiscount":
        return (
          <ul>
            <li>
              Spend over $400 on the Summer Collection - get 20% off each
              Summer Collection item
            </li>
            <li>Spend over $100 on Sneakers - get $5.00 off the order</li>
          </ul>
        );
      case "buyXgetY":
        return (
          <ul>
            <li>Buy 2 Get 1 Free*: Buy two shirts, get a third shirt of equal or lesser value for free.</li>
            <li>Buy 3 Get 1 free*: Buy three books, get a fourth book of equal  value off.</li>
            <li>Buy 2 Get 3: Buy two video games, get a third video game of equal value at off.</li>
            <li>Buy 1 Get 1 Free on Select Items*: Buy one select item, get a second select item of equal or lesser value for free.</li>
          </ul>
        );
      case "freeShipping":
        return (
          <ul>
            <li>Get X quantity to get the free shipping option</li>
          </ul>
        );
      default:
        return (
          <ul>
            <li>Select an offer type</li>
          </ul>
        );
    }
  }

  // function triggerMarginTable() {
  //   console.log("products:", formState.selectedProducts);
  //   console.log("number of products:", formState.selectedProducts.length);
  //   if (formState.offers) {
  //     const totalDiscountedQty = formState.offers.reduce((sum, offer) => sum + parseInt(offer.quantity, 10), 0);
  //     if (formState.offers[ formState.offers.length - 1 ].quantity !== "" && formState.offers[ formState.offers.length - 1 ].discountAmount !== "") {
  //       setFormState({ ...formState, renderTable: true, totalDiscountedQty: totalDiscountedQty });
  //     }
  //     console.log("renderTableformstate:", formState.renderTable);
  //   }
  // }

  function convertToIso(dateString) {
    const date = new Date(dateString);
    return date.toISOString();
  }

  function handleSave() {
    let data = {
      offerName: formState.offerName,
      offerType: formState.offerType,
      type: formState.type,
      subDiscount: formState.subDiscount,
      discountedAmount: formState.discountedAmount,
      startDate: (formState.startDate),
      endDate: (formState.endDate),
      offers: JSON.stringify(formState.offers),
      chartData: JSON.stringify(formState.chartData),
    };

    if (formState.products?.length > 0) {
      data.products = JSON.stringify(formState.products);
    }
    if (formState.collections?.length > 0) {
      data.collections = JSON.stringify(formState.collections);
    }
    if (formState.discountsID?.length > 0) {
      data.discountsID = JSON.stringify(formState.discountsID);
    }

    // Validate form data
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert dates to ISO format
    data = {
      ...data,
      startDate: convertToIso(formState.startDate),
      endDate: convertToIso(formState.endDate),
    }

    setErrors({});
    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  const handleDelete = () => {
    const data = {
      action: "delete",
      discountsID: JSON.stringify(formState.discountsID)
    }
    submit(data, { method: "post" });
  }

  const renderSelectedProducts = () => {
    if (formState.products) {
      // console.log("formState Data:", formState);

      const sortedProducts = [ ...(formState.products || []) ].sort();
      return sortedProducts.map((product) => (
        <Tag
        
            disabled = {Boolean(discounts.id)}
          key={product.id}
          onRemove={() => handleRemoveProduct(product.id, formState, setFormState)}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <Thumbnail
              source={product.imageUrl}
              alt={product.title}
              size="small"
              style={{ marginRight: '8px' }} // Adds some space between image and text
              
            disabled = {Boolean(discounts.id)}
            />
            {product.title}
          </span>
        </Tag>
      ));
    }
  };

  const renderSelectedCollections = () => {

    if (formState.collections) {
      const sortedCollections = [ ...(formState.collections || []) ].sort();
      return sortedCollections.map((collection) => (
        <Tag key={collection.id} onRemove={() => handleRemoveCollection(collection.id, formState, setFormState)}>
          {collection.title}
            disabled = {Boolean(discounts.id)}
        </Tag>
      ));
    }
  };

  const today = new Date().toISOString().split("T")[ 0 ];

  const handleStartDateChange = useCallback(
    (value) => {
      const currentDate = new Date().toISOString().split("T")[ 0 ];
      if (value < currentDate) {
        return;
      }
      if (value > formState.endDate) {
        setFormState({ ...formState, endDate: value });
      }
      setFormState({ ...formState, startDate: value });
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ formState ],
  );

  const handleEndDateChange = useCallback(
    (value) => {
      if (value < formState.startDate.split("T")[ 0 ]) {
        return;
      }
      setFormState({ ...formState, endDate: value });
    },
    [ formState ],
  );

  return (
    <Page fullWidth>
      <ui-title-bar
        title={
          discounts.id ? "Edit discount campaign" : "Create discount campaign"
        }
      >
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          Discount Designer
        </button>
      </ui-title-bar>

      <Grid>

        {/* Left side offer details section */}
        <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <Card sectioned>
            <BlockStack gap="500">
              <TextField
                id="offerName"
                label="Offer Name"
                disabled= {Boolean(discounts.id)}
                placeholder="Enter offer name"
                autoComplete="off"
                value={formState.offerName}
                onChange={(value) => {
                  setFormState({ ...formState, offerName: value });
                }}
                error={errors.offerName}
              />
              <Select
                label="Offer Type"
                disabled= {Boolean(discounts.id)}
                options={[
                  {
                    label: "Select discount type"
                  },
                  {
                    label: "Volume Discount",
                    value: "volumeDiscount"
                  },
                  {
                    label: "Spend Amount Discount",
                    value: "spendAmountDiscount",
                  },
                  {
                    label: "Buy X Get Y",
                    value: "buyXgetY"
                  },
                ]}
                value={formState.offerType}
                onChange={(value) => {
                  setFormState({ ...formState, offerType: value });
                }}
                error={errors.offerType}
              />
              <Text>Example : </Text>
            </BlockStack>

            <BlockStack>
              {renderDiscountExample(formState.offerType)}
            </BlockStack>

            <BlockStack gap="500">
              <Text>Choose Product/Collection</Text>
              <InlineStack gap="500">
                <Button id="products" onClick={() => selectProduct(formState, setFormState)} disabled={formState.type && formState.type !== 'product' || discounts.id}>
                  Select Products
                </Button>
                <Button id="collections" onClick={() => selectCollection(formState, setFormState)} disabled={formState.type && formState.type !== 'collection'|| discounts.id}>
                  Select Collections
                </Button>
              </InlineStack>
              <Text></Text>
              <div style={{ marginTop: "5px" }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "5px",
                    marginBottom: "5px",
                  }}
                >
                  {renderSelectedProducts()}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "5px",
                    marginBottom: "5px",
                  }}
                >
                  {renderSelectedCollections()}
                </div>
              </div>
            </BlockStack>
            <FormLayout.Group condensed title="Offer Details">
              <LegacyStack horizontal>
                <RadioButton
                  label="% off each"
                  checked={formState.subDiscount === "percentage"}
                  id="percentage"
                  name="subDiscount"
                  disabled={formState.offerType === "buyXgetY" || Boolean(discounts.id)}
                  
                  onChange={() => handlesubDiscountChange("percentage")}
                />
                <RadioButton
                  label={`$ Amount off each`}
                  checked={formState.subDiscount === "amount"}
                  id="amount"
                  name="subDiscount"
                  disabled={formState.offerType === "buyXgetY" || Boolean(discounts.id)}
                  onChange={() => handlesubDiscountChange("amount")}
                />
                <RadioButton
                  label={`Buy X Get Y`}
                  checked={formState.subDiscount === "bXgY" || Boolean(discounts.id)}
                  id="bXgY"
                  name="subDiscount"
                  disabled={formState.offerType !== "buyXgetY"}
                  onChange={() => handlesubDiscountChange("bXgY")}
                />
              </LegacyStack>
            </FormLayout.Group>

            <div style={{ marginTop: "10px" }}>{renderOfferRows()}</div>
            {formState.subDiscount && formState.offers.length < maxOffers && (
              <InlineStack gap="200">
                <Button 
                disabled= {Boolean(discounts.id)} primary onClick={() => handleAddOffer(maxOffers, formState, setFormState)}>
                  Add Offer
                </Button>
                {/* <Button primary onClick={triggerMarginTable}>
                  Analyze Offer
                </Button> */}
              </InlineStack>
            )}
            <BlockStack gap="500">

              <TextField
                type="date"
                value={formState.startDate?.split("T")[ 0 ]}
                label="Start Date"
                
                disabled= {Boolean(discounts.id)}
                onChange={handleStartDateChange}
                min={today}
                error={errors.startDate}
              />
              <TextField
                type="date"
                value={formState.endDate?.split("T")[ 0 ]}
                label="End Date"
                disabled= {Boolean(discounts.id)}
                onChange={handleEndDateChange}
                min={formState.startDate}
                error={errors.endDate}
              />

              <InlineStack gap="500">
                <PageActions
                  primaryAction={{
                    content: "save",
                    loading: isSaving,
                    disabled: !isDirty || isSaving || isDeleting || Boolean(discounts.id),
                    onAction: handleSave,
                  }}

                  secondaryActions={[
                    {
                      content: "Delete",
                      loading: isDeleting,
                      disabled: !formState?.id || isSaving || isDeleting , // Only disable if formState.id is falsy or currently saving/deleting
                      destructive: true,
                      outline: true,
                      onAction: handleDelete,
                    }
                  ]}
                />
              </InlineStack>

            </BlockStack>
          </Card>
        </Grid.Cell>

        {/* Rigth side Chart panel | Visual Analysis */}
        <VisualPanal formState={formState} setFormState={setFormState} />

      </Grid >
    </Page >
  );
}