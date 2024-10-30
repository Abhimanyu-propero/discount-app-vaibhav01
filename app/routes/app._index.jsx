import React, { useState, useEffect } from 'react';
import { json } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { CheckSession } from "../models/SessionInit"
import { getDiscounts } from "../models/discounts.server"
import { Card, Icon, EmptyState, IndexTable, Layout, Page, LegacyCard, Button, InlineStack } from "@shopify/polaris";
import { EyeCheckMarkIcon, ViewIcon } from '@shopify/polaris-icons';
import getSymbolFromCurrency from 'currency-symbol-map'
import { gridStyle, cardStyles } from "../components/Styles/style";
import { AovCard } from "./../components/Dashboard/AovCard";
import { TotalSales } from "./../components/Dashboard/TotalSales";
import { DiscountCampaignPerformance } from "./../components/Dashboard/DiscountCampaignPerformance";
import { ReturnOnDiscountSpend } from "./../components/Dashboard/ReturnOnDiscountSpend";
import { TotalOrders } from "./../components/Dashboard/TotalOrder";
import { WinningProduct } from "./../components/Dashboard/WinningProduct";
import { addDays, isBefore } from 'date-fns';

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

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const currencySymbol = await getCurrencySymbol(admin);
  const allDiscounts = await getDiscounts(session.shop);
  const subActive = await getStoreSubInfo(admin, session);
  // console.log("Subscription Active:", subActive);

  const orders = await admin.rest.resources.Order.all({
    limit: 100,
    session: session,
    status: "any",
  });

  const data = {
    allDiscounts: allDiscounts,
    currencySymbol: currencySymbol,
    ordersData: orders.data,
    ordersDataLen: orders.data.length,
    subActive: subActive
  };

  return json(data);
};

export async function action({ request }) {
  let data = await request.formData();
  // data = Object.fromEntries(data);
  return json(data);
}

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

function getWinningProduct(products) {
  let maxCount = 0;

  const countOccurrences = products.reduce((acc, curr) => {
    acc[ curr ] = (acc[ curr ] || 0) + 1;
    return acc;
  }, {});

  const sortedProducts = Object.entries(countOccurrences)
    .sort(([ , countA ], [ , countB ]) => countB - countA)
    .map(([ product ]) => product);

  if (sortedProducts.length < 3) {
    return sortedProducts.slice(0, 1);
  } else {
    return sortedProducts.slice(0, 3);
  }
}

function getCampaignWiseAnalysis(discountCampaign, currencySymbol, orders) {
  const filteredOrders = orders.filter((order) =>
    order.discount_applications &&
    order.discount_applications.length > 0 &&
    order.cancelled_at === null &&
    order.discount_applications[ 0 ].title.includes(discountCampaign)
  );
  let totalOrders = 0;
  let productNames = [];
  let totalSales = 0;
  let totalPrice = 0;
  let totalTax = 0;
  let totalShippingCharge = 0;
  let totalRevenue = 0;
  let totalDiscounts = 0;
  let aov = 0;
  let returnOnDiscountSpent = 0;
  let winningProduct = "";

  filteredOrders.forEach(order => {
    totalOrders++;
    order.line_items.forEach(item => {
      productNames.push(item.name);
    });
    totalSales += parseFloat(order.current_total_price);
    totalDiscounts += parseFloat(order.total_discounts);
    totalPrice += parseFloat(order.total_price);
    totalTax += parseFloat(order.total_tax);
    totalShippingCharge += parseFloat(order.total_shipping_price_set.shop_money.amount);
  });
  aov = ((totalSales - totalDiscounts) / totalOrders).toFixed(2);
  totalRevenue = totalPrice - totalDiscounts + totalTax + totalShippingCharge;
  returnOnDiscountSpent = (totalRevenue / totalDiscounts).toFixed(2);
  winningProduct = getWinningProduct(productNames);
  console.log("Campaign name:", discountCampaign);
  console.log("Total Orders:", totalOrders);
  console.log("Product Names:", productNames.join(', '));
  console.log("Winning Product:", winningProduct);
  console.log("Total Sales:", totalSales.toFixed(2));
  console.log("Total Discounts Applied:", totalDiscounts);
  console.log("AOV:", aov);
  console.log("RoDS:", returnOnDiscountSpent);
  console.log("------------------------------------------------------------------------------------------");
  return {
    totalOrders: totalOrders,
    winningProduct: winningProduct,
    totalSales: `${currencySymbol} ${totalSales}`,
    totalDiscounts: `${currencySymbol} ${totalDiscounts.toFixed(2)}`,
    aov: `${currencySymbol} ${aov}`,
    returnOnDiscountSpent: returnOnDiscountSpent
  };
}

function getAllCampaignAnalysis(currencySymbol, ordersData, filter) {
  console.log("filter:", filter);

  let totalOrders = 0;
  let productNames = [];
  let totalSales = 0;
  let totalPrice = 0;
  let totalTax = 0;
  let totalShippingCharge = 0;
  let totalRevenue = 0;
  let totalDiscounts = 0;
  let aov = 0;
  let returnOnDiscountSpent = 0;
  let winningProduct = "";
  let filteredOrders = [];

  if (filter.toLowerCase() === "false") {
    filteredOrders = ordersData.filter((order) =>
      order.cancelled_at === null
    );
  } else if (filter.toLowerCase() === "true") {
    filteredOrders = ordersData.filter((order) =>
      order.discount_applications &&
      order.cancelled_at === null &&
      order.discount_applications.length > 0
    );
  }
  if (filteredOrders.length === 0) {
    return 0;
  }
  filteredOrders.forEach(order => {
    totalOrders++;
    order.line_items.forEach(item => {
      productNames.push(item.name);
    });
    totalSales += parseFloat(order.current_total_price);
    totalDiscounts += parseFloat(order.total_discounts);
    totalPrice += parseFloat(order.total_price);
    totalTax += parseFloat(order.total_tax);
    totalShippingCharge += parseFloat(order.total_shipping_price_set.shop_money.amount);
  });
  aov = ((totalSales - totalDiscounts) / totalOrders).toFixed(2);
  totalRevenue = totalPrice - totalDiscounts + totalTax + totalShippingCharge;
  if (totalDiscounts > 0) {
    returnOnDiscountSpent = (totalRevenue / totalDiscounts).toFixed(2);
  } else {
    returnOnDiscountSpent = "N/A";
  }
  winningProduct = getWinningProduct(productNames);
  return {
    totalOrders: totalOrders,
    winningProduct: winningProduct,
    totalSales: `${currencySymbol} ${Number(totalSales).toFixed(2)}`,
    totalDiscounts: `${currencySymbol} ${totalDiscounts.toFixed(2)}`,
    aov: `${currencySymbol} ${aov}`,
    returnOnDiscountSpent: returnOnDiscountSpent
  };
}

function status(startDate, endDate) {
  const currentDate = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (currentDate >= start && currentDate <= end) return "Campaign running";
  if (start > currentDate) return "yet to start"
  return "Campaign Ended";
}

const EmptyDiscountState = ({ onAction }) => (
  <EmptyState
    heading="Create unique discounts for your products"
    action={{
      content: "Create Discount",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow merchant to create discounts and analyse profit margins</p>
  </EmptyState>
);

export default function Index() {
  const data = useLoaderData();
  const navigate = useNavigate();
  const [ homeState, setHomeState ] = useState({
    ...data,
    offerName: null,
    analytics: {
      aov: 0,
      totalSales: 0,
      returnOnDiscountSpent: 0,
      totalOrders: 0,
      winningProduct: null,
      totalDiscounts: 0,
    },
  });

  useEffect(() => {
    if (!homeState.subActive) navigate("/app/pricing");
    if (!homeState.offerName) {
      let analyticsData = {};

      analyticsData = getAllCampaignAnalysis(homeState.currencySymbol, homeState.ordersData, "true");
      if (analyticsData === 0) {
        analyticsData = getAllCampaignAnalysis(homeState.currencySymbol, homeState.ordersData, "false");
      }

      setHomeState((prevState) => ({
        ...prevState,
        analytics: analyticsData,
      }));
      return;
    };

    let offerAnalyticsData = getCampaignWiseAnalysis(
      homeState.offerName,
      homeState.currencySymbol,
      homeState.ordersData
    );

    setHomeState((prevState) => ({
      ...prevState,
      analytics: offerAnalyticsData,
    }));
  }, [ homeState.offerName ]);


  const CampaignTable = ({ allDiscounts }) => (
    <IndexTable
      resourceName={{
        singular: "Discount",
        plural: "Discounts"
      }}
      itemCount={allDiscounts.length}
      headings={[
        { title: "Offer Name" },
        { title: "Offer Type" },
        { title: "Start Date" },
        { title: "End Date" },
        { title: "Status" },
        { title: "Campaign Analysis" },
        { title: "View Discount" },
      ]}
      selectable={false}
    >
      {allDiscounts.map((discounts) => (
        <CampaignTableRow key={discounts.id} discounts={discounts} />
      ))}
    </IndexTable>
  );

  // Truncate function flips the string if it is too long
  function truncate(str, { length = 25 } = {}) {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.slice(0, length) + "…";
  }

  const CampaignTableRow = ({ discounts }) => (
    <IndexTable.Row id={discounts.id} position={discounts.id}>

      <IndexTable.Cell>
        {truncate(discounts.offerName)}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {discounts.offerType}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {new Date(discounts.startDate).toDateString()}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {new Date(discounts.endDate).toDateString()}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {(status((new Date(discounts.startDate)), (new Date(discounts.endDate)))) || ""}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <InlineStack spacing="tight" gap={'100'}>
          <Button
            id={`button-${discounts.offerName}`}
            variant="primary"
            submit={true}
            disabled={discounts.offerName === homeState.offerName}
            onClick={() => setHomeState({ ...homeState, offerName: discounts.offerName })}
          >
            Analyze
          </Button>
          <Button
            id={`button-${discounts.offerName}`}
            variant="primary"
            tone="critical"
            submit={true}
            disabled={discounts.offerName !== homeState.offerName}
            onClick={() => setHomeState({ ...homeState, offerName: null })}
          >
            Deselect
          </Button>
        </InlineStack>
      </IndexTable.Cell>

      <IndexTable.Cell >
        <Link to={`discounts/${discounts.id}`}>
          <Icon
            source={ViewIcon}
            tone="base"
          />
        </Link>

      </IndexTable.Cell>

    </IndexTable.Row>
  );

  if (homeState.analytics.totalOrders > 0) {
    return (
      <Page fullWidth>
        <ui-title-bar title="Discount Campaigns">
          <button variant="primary" onClick={() => navigate("/app/discounts/new")}>
            Create Discount
          </button>
        </ui-title-bar>
        <Page fullWidth>
          <LegacyCard sectioned style={{ backgroundColor: "--p-color-bg-surface-caution" }}>
            <div style={gridStyle}>
              {homeState.analytics ? (
                <>
                  <Card sectioned style={cardStyles.aovCard}>
                    <AovCard aovValue={homeState.analytics.aov} />
                  </Card>
                  <Card sectioned style={cardStyles.conversionRateCard}>
                    <TotalSales totalSales={homeState.analytics.totalSales} />
                  </Card>
                  <Card sectioned style={cardStyles.returnOnDiscountSpendCard}>
                    <ReturnOnDiscountSpend rods={homeState.analytics.returnOnDiscountSpent} />
                  </Card>
                  <Card sectioned style={cardStyles.totalProductSoldCard}>
                    <TotalOrders totalOrders={homeState.analytics.totalOrders} />
                  </Card>
                  <Card sectioned style={cardStyles.winningProductCard}>
                    <WinningProduct winningProduct={homeState.analytics.winningProduct} />
                  </Card>
                  <Card sectioned style={cardStyles.discountCampaignPerformanceCard}>
                    <DiscountCampaignPerformance totalDiscountedAmount={homeState.analytics.totalDiscounts} />
                  </Card>
                </>
              ) : (<div>Loading...</div>)}
            </div>
          </LegacyCard>
          {/* <Card> */}
          {/* <CampaignTable allDiscounts={data.allDiscounts}/> */}
          {/* </Card> */}

        </Page>

        <Page fullWidth>
          <Card padding="0">
            {
              homeState.allDiscounts.length === 0 ? (<EmptyDiscountState onAction={() => navigate("discounts/new")} />)
                :
                (<CampaignTable allDiscounts={homeState.allDiscounts} />)
            }
          </Card>
        </Page>
      </Page>
    );
  } else {
    return (
      <Page fullWidth>
        <ui-title-bar title="Discount Campaigns">
          <button variant="primary" onClick={() => navigate("/app/discounts/new")}>
            Create Discount
          </button>
        </ui-title-bar>
        <LegacyCard sectioned>
          <EmptyState
            heading="No orders found for this campaign!"
            fullWidth
          >
          </EmptyState>
        </LegacyCard>
        <Page fullWidth>
          <Card padding="0">
            {
              homeState.allDiscounts.length === 0 ? (<EmptyDiscountState onAction={() => navigate("discounts/new")} />)
                :
                (<CampaignTable allDiscounts={homeState.allDiscounts} />)
            }
          </Card>
        </Page>
      </Page>
    );
  }
}
