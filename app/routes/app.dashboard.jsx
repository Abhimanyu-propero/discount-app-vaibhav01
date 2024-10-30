import {json} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react';
import React, { useState, useCallback, useEffect } from 'react';
import { IndexTable, Text, ButtonGroup, Button, RadioButton, Card,
    LegacyCard,
    Page,
    Form,
    ExceptionList
  } from "@shopify/polaris";

  import { authenticate } from "./../shopify.server";
  import getSymbolFromCurrency from 'currency-symbol-map'
  import { AovCard } from "./../components/Dashboard/AovCard";
  import { TotalSales } from "./../components/Dashboard/TotalSales";
  import { DiscountCampaignPerformance } from "./../components/Dashboard/DiscountCampaignPerformance";
  import { ReturnOnDiscountSpend } from "./../components/Dashboard/ReturnOnDiscountSpend";
  import { TotalOrders } from "./../components/Dashboard/TotalOrder";
  import { WinningProduct } from "./../components/Dashboard/WinningProduct";
import { getDiscounts } from "./../models/discounts.server";

let offerNameState = "";

const setOfferName = (offerName) => {
  offerNameState = offerName;
};

const getOfferName = () => {
  return offerNameState;
};

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
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
  }, {});

  const sortedProducts = Object.entries(countOccurrences)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([product]) => product);

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
        order.discount_applications[0].title.includes(discountCampaign)
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
        totalDiscounts += Math.floor(parseFloat(order.total_discounts));
        totalPrice += parseFloat(order.total_price);
        totalTax += parseFloat(order.total_tax);
        totalShippingCharge += parseFloat(order.total_shipping_price_set.shop_money.amount);
    });
    aov = ((totalSales - totalDiscounts) / totalOrders).toFixed(2);
    totalRevenue = totalPrice - totalDiscounts + totalTax + totalShippingCharge;
    returnOnDiscountSpent = (totalRevenue / totalDiscounts).toFixed(2);
    winningProduct = getWinningProduct(productNames);
    // console.log(Campaign name: ${discountCampaign});
    // console.log(Total Orders: ${totalOrders});
    // console.log(Product Names: ${productNames.join(', ')});
    // console.log(Winning Product: ${winningProduct});
    // console.log(Total Sales: ${totalSales.toFixed(2)});
    // console.log(Total Discounts Applied: ${totalDiscounts});
    // console.log(AOV: ${aov});
    // console.log(RoDS: ${returnOnDiscountSpent});
    // console.log("------------------------------------------------------------------------------------------");
    return {
      "totalOrders": totalOrders,
      "winningProduct": winningProduct,
      "totalSales": `${currencySymbol} ${totalSales}`,
      "totalDiscounts": `${currencySymbol} ${totalDiscounts}`,
      "aov": `${currencySymbol} ${aov}`,
      "returnOnDiscountSpent": returnOnDiscountSpent
    };
  // }
}

function getAllCampaignAnalysis(currencySymbol, ordersData, filter) {
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
    "totalOrders": totalOrders,
    "winningProduct": winningProduct,
    "totalSales": `${currencySymbol} ${Number(totalSales).toFixed(2)}`,
    "totalDiscounts": `${currencySymbol} ${totalDiscounts}`,
    "aov": `${currencySymbol} ${aov}`,
    "returnOnDiscountSpent": returnOnDiscountSpent
  };
}

export async function loader({ request }) {
  let analyticsData = 0;
   const { admin, session } = await authenticate.admin(request);
   const currencySymbol = await getCurrencySymbol(admin);
   const allDiscounts = await getDiscounts(session.shop);
   const orders = await admin.rest.resources.Order.all({
    limit: 100,
    session: session,
    status: "any",
  });
  // console.log("ordersData:", orders.data);
  if (offerNameState !== "") {
    analyticsData = getCampaignWiseAnalysis(offerNameState, currencySymbol, orders.data);
  } else {
    analyticsData = getAllCampaignAnalysis(currencySymbol, orders.data, "true");
    if (analyticsData === 0) {
      analyticsData = getAllCampaignAnalysis(currencySymbol, orders.data, "false");
    }
  }
  
   return json({
     "allDiscounts": allDiscounts,
     "analytics": analyticsData,
     "ordersData": orders.data.length,
     "campaignName": offerNameState
   });
 };

export async function action({ request }) {
  let data = await request.formData();
  // data = Object.fromEntries(data);
  return json(data);
}


export default function Dashboard() {
  const data = useLoaderData();
  console.log("data:", data);

  return (
    <Page fullWidth>
      <div style={parentStyle}> {/* Parent container with padding and new background */}
        <div style={gridStyle}>
          <div style={cardStyles.card}>
            <AovCard aovValue={data.analytics.aov} />
          </div>
          <div style={cardStyles.card}>
            <TotalSales totalSales={data.analytics.totalSales} />
          </div>
          <div style={cardStyles.card}>
            <ReturnOnDiscountSpend rods={data.analytics.returnOnDiscountSpent} />
          </div>
          <div style={cardStyles.card}>
            <TotalOrders totalOrders={data.analytics.totalOrders} />
          </div>
          <div style={cardStyles.card}>
            <WinningProduct winningProduct={data.analytics.winningProduct} />
          </div>
          <div style={cardStyles.card}>
            <DiscountCampaignPerformance totalDiscountedAmount={(Number(data.analytics.totalDiscounts)||0).toFixed(2)} />
          </div>
        </div>
      </div>

      <Card>
        <CampaignTable allDiscounts={data.allDiscounts} />
      </Card>
    </Page>
  );
}

const parentStyle = {
  padding: "20px",               // Add padding for the parent container
  backgroundColor: "#F3EFD2",    // Set the background color for the entire container
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)", // 3 equal columns
  gap: "29px", // gap between cards
  padding: "20px",
};

const cardStyles = {
  card: {
    height: "240px",             // Fixed height for all cards
    width: "240px",              // Fixed width (making it a square)
    borderRadius: "8px",         // Rounded corners
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",    // Center the content vertically
    alignItems: "center",        // Center the content horizontally
    padding: "7px",
    backgroundColor: "#F4F0D5",  // Same background color for all cards
    textAlign: "center",         // Center text inside the card
    gap: "5px",                 // Gap between heading and value
    border: "2px solid #4E13A0", // Updated border color to #4E13A0 for all cards
    overflow: "hidden",          // Ensure content stays within the card
    wordWrap: "break-word",      // Break words if they are too long
    textOverflow: "ellipsis",    // Handle overflow by adding "..."
  },
    aovCard: {
      backgroundColor: "#F4F0D5",  // Change background color to #fef3c2 for all cards
      border: "2px solid #ddd",
    },
    conversionRateCard: {
      backgroundColor: "#F4F0D5",
      border: "2px solid #b2ebf2",
    },
    returnOnDiscountSpendCard: {
      backgroundColor: "#F4F0D5",
      border: "2px solid #f0f4c3",
    },
    totalProductSoldCard: {
      backgroundColor: "#F4F0D5",
      border: "2px solid #ffcc80",
    },
    winningProductCard: {
      backgroundColor: "#F4F0D5",
      border: "2px solid #a5d6a7",
    },
    discountCampaignPerformanceCard: {
      backgroundColor: "#F4F0D5",
      border: "2px solid #ce93d8",
    },
  };
  
  function status(startDate, endDate) {
    const currentDate = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (currentDate >= start && currentDate <= end) return "Campaign running";
    if (start > currentDate) return "Yet to start";
    return "Campaign Ended";
  }
  
  // Updated ToggleButtonGroup component
  const ToggleButtonGroup = ({ isEnabled, onToggle, isDisabled }) => {
    const handleEnableClick = useCallback(() => {
      if (!isEnabled) onToggle(true);
    }, [isEnabled, onToggle]);
  
    const handleDisableClick = useCallback(() => {
      if (isEnabled) onToggle(false);
    }, [isEnabled, onToggle]);
  
    return (
      <ButtonGroup variant="segmented">
        <Button 
          pressed={isEnabled} 
          onClick={handleEnableClick}
          disabled={isDisabled && !isEnabled}
        >
          Enable
        </Button>
        <Button 
          pressed={!isEnabled} 
          onClick={handleDisableClick}
          disabled={isDisabled && isEnabled}
        >
          Disable
        </Button>
      </ButtonGroup>
    );
  };
  
  // Updated CampaignTableRow component
  const CampaignTableRow = ({ 
    discount, 
    isEnabled,
    onToggle,
    isDisabled,
    selectedCampaign,
    onSelectCampaign 
  }) => {
    if (status(discount.startDate, discount.endDate) !== "Campaign Ended") {
    return (
      <IndexTable.Row 
        id={discount.id} 
        position={discount.id}
        selected={isEnabled}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight={isEnabled ? "bold" : "regular"}>
            {discount.offerName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{discount.offerType}</IndexTable.Cell>
        <IndexTable.Cell>{new Date(discount.startDate).toDateString()}</IndexTable.Cell>
        <IndexTable.Cell>{new Date(discount.endDate).toDateString()}</IndexTable.Cell>
        <IndexTable.Cell>{status(discount.startDate, discount.endDate)}</IndexTable.Cell>
        <IndexTable.Cell>
          <ToggleButtonGroup
            isEnabled={isEnabled}
            onToggle={(newState) => onToggle(discount.id, newState)}
            isDisabled={isDisabled}
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
            {/* <RadioButton
              label=""
              checked={selectedCampaign === discount.offerName}
            id={`radio-${discount.offerName}`}
            name="selectedCampaign"
            onChange={() => onSelectCampaign(discount.offerName)}
            /> */}
              {/* <Button id={radio-${discount.offerName}} variant='primary' submit={true} onClick={() => onSelectCampaign(discount.offerName)}>Analyze</Button> */}
            <Form method="post" action="/analyze" encType="application/x-www-form-urlencoded">
              <input type="hidden" name="campaignName" value={discount.offerName} />
              <Button 
                id={`radio-${discount.offerName}`} 
                variant="primary" 
                submit={true}
                // onClick={() => onSelectCampaign(discount.offerName)}
              >
                Analyze
              </Button>
            </Form>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  };

  // Main component to display the IndexTable
  const CampaignTable = ({ allDiscounts }) => {
    const [enabledCampaigns, setEnabledCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
  
    const handleToggleCampaign = useCallback((campaignId, newState) => {
      setEnabledCampaigns(prev => {
        if (newState) {
          return [...prev, campaignId];
        } else {
          return prev.filter(id => id !== campaignId);
        }
      });
    }, []);
  
    const handleSelectCampaign = useCallback((campaignId) => {
      setSelectedCampaign(prevSelected => prevSelected === campaignId ? null : campaignId);
      console.log("selectedCampaign:", selectedCampaign);
      console.log("campaignid:", campaignId);
    }, []);
  
    return (
      <div style={campaignTableStyles}>
        <IndexTable
          resourceName={{
            singular: "Discount",
            plural: "Discounts"
          }}
          itemCount={allDiscounts.length}
          headings={[
            { title: <span style={headingStyles}>Offer Name</span> },
            { title: <span style={headingStyles}>Offer Type</span> },
            { title: <span style={headingStyles}>Start Date</span> },
            { title: <span style={headingStyles}>End Date</span> },
            { title: <span style={headingStyles}>Status</span> },
            { title: <span style={headingStyles}>Disable Campaign</span> },
            { title: <span style={headingStyles}>Campaign Sales Analysis</span> },
          ]}
          selectable={false}
        >
          {allDiscounts.map((discount) => (
            <CampaignTableRow
              key={discount.id}
              discount={discount}
              isEnabled={enabledCampaigns.includes(discount.id)}
              onToggle={handleToggleCampaign}
              isDisabled={enabledCampaigns.length > 0 && !enabledCampaigns.includes(discount.id)}
              onSelectCampaign={handleSelectCampaign}
            />
          ))}
        </IndexTable>
      </div>
    );
    
  };
  const campaignTableStyles = {
    border: "2px solid #4E13A0", // Border color for the table
    borderRadius: "8px",         // Optional: add rounded corners
    margin: "10px",              // Add some margin around the table
  };
  
  const headingStyles = {
    color: "#4E13A0",            // Color for table headings
    fontWeight: "bold",          // Optional: make headings bold
  };
