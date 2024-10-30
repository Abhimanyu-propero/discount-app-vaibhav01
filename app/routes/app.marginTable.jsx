import React, { useState, useEffect, useCallback } from "react";
import { Card, Grid, Text, TextField, DataTable } from "@shopify/polaris";
import { calculateDiscountMarginBxGy } from "../lib/discountUtils";

let handleMarginValue = "";

export default function MarginAnalyzer({ numDiscountedCategories, totalDiscountedQty, selectionType, totalDiscountedAmount }) {
  let tdAmount = 0.00;
  if (totalDiscountedAmount !== undefined) {
    tdAmount = totalDiscountedAmount;
  }
  const [ margin, setMargin ] = useState("");
  const [ numDiscountedProducts, setNumDiscountedProducts ] = useState(0);
  const [ numDiscountedCollections, setNumDiscountedCollections ] = useState(0);
  const [ BaselineMargin, setBaselineMargin ] = useState(0);
  const [ BAFOMargin, setBAFOMargin ] = useState(0);

  let totalDiscountedCost = 0;

  const handleMargin = useCallback((value) => {
    setMargin(value);
    handleMarginValue = value;
    console.log("margin----->", handleMarginValue);
  }, []);

  // const totalOverallMarginLost = totalInitialCost > 0 o
  //   ? ((totalInitialCost - totalDiscountedCost) / totalInitialCost) * 100 
  //   : 0;

  // console.log(`Total Overall Margin Lost after Discount: ${totalOverallMarginLost.toFixed(2)}%`);

  const fetchDataForAnalysis = () => {
    // console.log("numDiscountedCategories:", numDiscountedCategories);
    // Simulated data fetching (replace with actual logic)
    // console.log("selection type:", selectionType);
    if (selectionType === "product") {
      setNumDiscountedProducts(numDiscountedCategories);
      setNumDiscountedCollections(0);
    } else if (selectionType === "collection") {
      setNumDiscountedCollections(numDiscountedCategories);
      setNumDiscountedProducts(0);
    }
    // console.log("discountedproducts:", numDiscountedProducts);
    // console.log("discountedcollections:", numDiscountedCollections);
    // console.log("value:", value);
    // setTotalDiscountedAmount("$30,000.00");
    // setNumDiscountedCategories("-");
    setBaselineMargin(100);
    setBAFOMargin(20);
  };

  useEffect(() => {
    fetchDataForAnalysis();
  }, [ selectionType, numDiscountedCategories ]);

  useEffect(() => {
    if (selectionType === "product") {
      // console.log("discounted products:", numDiscountedProducts);
      setNumDiscountedProducts(numDiscountedCategories);
      setNumDiscountedCollections(0);
    } else if (selectionType === "collection") {
      // console.log("discounted collections:", numDiscountedCollections);
      setNumDiscountedCollections(numDiscountedCategories);
      setNumDiscountedProducts(0);
    }
  }, [ numDiscountedProducts, numDiscountedCollections, selectionType ]);

  // const bafoMarginTone = parseFloat(BAFOMargin) < parseFloat(margin) ? "critical" : "success";

  // console.log("numDiscountedProducts:", numDiscountedProducts);
  // console.log("numDiscountedCollections:", numDiscountedCollections);


  return (
    <div style={{ marginTop: "10px", marginBottom: "10px" }}>
      <Text variant="headingXs" as="h6">
        Discount Campaign Analysis
      </Text>
      {/* <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <Text variant="bodySm" as="p" alignment="center">
              Set the Expected Overall margin for this Discounting Campaign:
            </Text>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <TextField
              value={margin}
              name="margin"
              placeholder="value%"
              onChange={handleMargin}
            />
          </Grid.Cell>
        </Grid>
      </div> */}
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <div>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Text variant="bodySm" as="p" alignment="center">
                    Total Discounted QTY
                  </Text>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Card padding={{ xs: "40", sm: "40" }}>
                    <Text
                      variant="bodySm"
                      as="p"
                      fontWeight="bold"
                      alignment="center"
                    >
                      {totalDiscountedQty}
                    </Text>
                  </Card>
                </Grid.Cell>
              </Grid>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <div>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Text variant="bodySm" as="p" alignment="center">
                    Total Discounted Amount
                  </Text>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Card padding={{ xs: "40", sm: "40" }}>
                    <Text
                      variant="bodySm"
                      as="p"
                      fontWeight="bold"
                      alignment="center"
                    >
                      {tdAmount}
                    </Text>
                  </Card>
                </Grid.Cell>
              </Grid>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <div>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Text variant="bodySm" as="p" alignment="center">
                    Number of Discounted Products
                  </Text>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Card padding={{ xs: "40", sm: "40" }}>
                    <Text
                      variant="bodySm"
                      as="p"
                      fontWeight="bold"
                      alignment="center"
                    >
                      {numDiscountedProducts}
                    </Text>
                  </Card>
                </Grid.Cell>
              </Grid>
            </div>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <div>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Text variant="bodySm" as="p" alignment="center">
                    Number of Discounted Collections
                  </Text>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Card padding={{ xs: "40", sm: "40" }}>
                    <Text
                      variant="bodySm"
                      as="p"
                      fontWeight="bold"
                      alignment="center"
                    >
                      {numDiscountedCollections}
                    </Text>
                  </Card>
                </Grid.Cell>
              </Grid>
            </div>
          </Grid.Cell>
        </Grid>
      </div>
    </div>
  );
}

export function MarginAnalyzerRows({ offers, subDiscount, marginAfterDiscounting, marginLostAfterDiscount, currencySymbol, aov, chartData, initialDataKey, discountedDataKey }) {

  // console.log("MarginAnalyzerRowsoffers:", offers);
  // console.log("MarginAnalyzerRowssubdicount:", subDiscount);
  let headings = [ "QTY", "Discount", "% Margin Reduction after discounting" ];

  const [ BaselineMargin, setBaselineMargin ] = useState(100);
  const [ BAFOMargin, setBAFOMargin ] = useState(0);
  const [ margin, setMargin ] = useState("");

  // setBaselineMargin(20);
  // setBAFOMargin(20);

  const handleMargin = useCallback((value) => {
    if (parseFloat(value) >= 0 || value === "") {
      setMargin(value);
    }
  }, []);

  const bafoMarginTone = margin === "" || parseFloat(margin) < parseFloat(marginLostAfterDiscount) ? "critical" : "success";
  // console.log("bafomargintone:", bafoMarginTone);
  let rows = [];
  let slicedRows = [];
  if (offers[ offers.length - 1 ].discountAmount !== "") {
    slicedRows = offers;
  } else if (offers[ offers.length - 1 ].discountAmount === "") {
    slicedRows = offers.slice(0, offers.length - 1);
  }
  // console.log("subDiscount:", subDiscount);
  if (subDiscount === "percentage") {
    rows = slicedRows.map(offer => {
      const quantity = parseInt(offer.quantity);
      const discountPercent = `${offer.discountAmount}%`;
      const discountValue = `${-parseFloat(offer.discountAmount)}%`;

      return [ quantity, discountPercent, discountValue ];
    });
  } else if (subDiscount === "amount") {
    rows = slicedRows.map(offer => {
      const quantity = parseInt(offer.quantity);
      const discountPercent = `${offer.discountAmount}${currencySymbol}`;
      const discountValue = `${-parseFloat(offer.discountAmount)}${currencySymbol}`;

      return [ quantity, discountPercent, discountValue ];
    });
  } else if (subDiscount === "bXgY") {
    headings = [ "Buy", "Get", "% Margin Reduction after discounting" ]
    const percentageMarginReduction = calculateDiscountMarginBxGy(chartData, discountedDataKey, initialDataKey)
    rows = slicedRows.map(offer => {
      const quantity = parseInt(offer.quantity);
      const discountPercent = `${offer.discountAmount}`;
      const discountValue = `${-percentageMarginReduction.toFixed(2)}%`;

      return [ quantity, discountPercent, discountValue ];
    });
  }

  return (
    <div>
      <Text variant="headingXs" as="h6">
        Discount Margin Analysis
      </Text>
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <DataTable
          columnContentTypes={[ "numeric", "numeric", "numeric" ]}
          headings={headings}
          // rows={[
          //   [10, "$5.00", "25.00%"],
          //   [20, "$10.00", "20.00%"],
          //   [15, "$7.50", "22.50%"],
          //   // Add more rows as needed
          // ]}
          rows={rows}
        />
      </div>
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <Text variant="bodySm" as="p" alignment="center">
              Set the Expected Overall margin for this Discounting Campaign:
            </Text>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
            <TextField
              value={margin}
              name="margin"
              placeholder="value%"
              onChange={handleMargin}
            />
          </Grid.Cell>
        </Grid>
      </div>
      <Grid>
        {/* <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center">
                      Baseline Margin
                    </Text>
                  </Grid.Cell>
                  <Text variant="bodySm" as="p" fontWeight="bold" alignment="center">
                    {BaselineMargin}
                  </Text>
                </Grid>
              </div>
            </Card>
            <Text variant="bodyXs" tone="critical" as="p" alignment="center">
              *Margin Before the Final Discount
            </Text>
          </div>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center" tone={bafoMarginTone}>
                      BAFO Margin
                    </Text>
                  </Grid.Cell>
                  <Grid.Cell>
                    <Text variant="bodySm" as="p" fontWeight="bold" alignment="center" tone={bafoMarginTone}>
                      {BAFOMargin}
                    </Text>
                  </Grid.Cell>
                </Grid>
              </div>
            </Card>
            <Text variant="bodyXs" tone="critical" as="p" alignment="center">
              *Best and final Offering (Margin after the final Discount)
            </Text>
          </div>
        </Grid.Cell> */}
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center">
                      Margin Before Final Discounting
                    </Text>
                  </Grid.Cell>
                  <Grid.Cell>
                    <Text variant="bodySm" as="p" fontWeight="bold" alignment="center">
                      100%
                    </Text>
                  </Grid.Cell>
                </Grid>
              </div>
            </Card>
          </div>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center">
                      Margin After Final Discounting
                    </Text>
                  </Grid.Cell>
                  <Grid.Cell>
                    <Text variant="bodySm" as="p" fontWeight="bold" alignment="center">
                      {marginAfterDiscounting}%
                    </Text>
                  </Grid.Cell>
                </Grid>
              </div>
            </Card>
          </div>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center" tone={bafoMarginTone}>
                      Overall Margin Lost after Discount
                    </Text>
                  </Grid.Cell>
                  <Grid.Cell>
                    <Text variant="bodySm" as="p" fontWeight="bold" alignment="center" tone={bafoMarginTone}>
                      {marginLostAfterDiscount}%
                    </Text>
                  </Grid.Cell>
                </Grid>
              </div>
            </Card>
          </div>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Card padding={{ xs: "40", sm: "40" }}>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                    <Text variant="bodySm" as="p" alignment="center">
                      AOV
                    </Text>
                  </Grid.Cell>
                  <Grid.Cell>
                    <Text variant="bodySm" as="p" fontWeight="bold" alignment="center">
                      {aov}
                    </Text>
                  </Grid.Cell>
                </Grid>
              </div>
            </Card>
          </div>
        </Grid.Cell>
      </Grid>
    </div>
  );
}
