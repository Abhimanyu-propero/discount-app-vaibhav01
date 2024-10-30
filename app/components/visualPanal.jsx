import {
    Button,
    ButtonGroup,
    Card,
    Grid,
    Icon,
    Modal,
    BlockStack,
} from "@shopify/polaris";
import {
    MaximizeIcon,
    MinimizeIcon
} from "@shopify/polaris-icons";
import React, { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import MarginAnalyzer, { MarginAnalyzerRows } from "../routes/app.marginTable";
// import MarginAnalyzer, { MarginAnalyzerRows } from "../components/app.marginTable";
import { getTotalDiscountedAmountBxGy } from "../lib/discountUtils";

const visualPanal = ({ formState, setFormState }) => {

    const [ showLineChart, setShowLineChart ] = useState(false);
    const [ modalActive, setModalActive ] = useState(false);
    const [ maxValue, setMaxValue ] = useState(0);

    useEffect(() => {
        if (formState.chartData && formState.chartData.length > 0) {
            const maxInitialPricing = Math.max(
                ...formState.chartData.map(
                    (item) => parseFloat(item[ formState.initialDataKey ]) || 0,
                ),
            );

            // console.log("Initial Data Key:", formState.initialDataKey);
            // console.log("Discounted Data Key:", formState.discountedDataKey);
            console.log("formstatevisualpanal:", formState);
            console.log("formState.selectedProducts:", formState.products);

            let initialSum = 0;
            let discountedSum = 0;
            let totalDiscountedAmount = 0;

            formState.chartData.forEach(data => {
                initialSum += parseFloat(data[ formState.initialDataKey ]);
                discountedSum += parseFloat(data[ formState.discountedDataKey ]);
            });
            if (formState.subDiscount !== undefined) {
                if (formState.subDiscount.toLowerCase() === "bxgy") {
                    if (formState.type === "product") {
                        totalDiscountedAmount = getTotalDiscountedAmountBxGy(formState.products, formState.offers);
                    } else if (formState.type === "collection") {
                        totalDiscountedAmount = getTotalDiscountedAmountBxGy(formState.collections, formState.offers, true);
                    }
                } else {
                    totalDiscountedAmount = (initialSum - discountedSum).toFixed(2);
                }
            }
            const marginAfterDiscounting = ((discountedSum / initialSum) * 100).toFixed(2);
            const marginLostAfterDiscount = (100 - marginAfterDiscounting).toFixed(2);

            // console.log("total discounted price:", totalDiscountedAmount);
            // console.log("marginAfterDiscounting:", marginAfterDiscounting);
            // console.log("marginLostAfterDiscount:", marginLostAfterDiscount);

            const maxDiscountedPricing = Math.max(
                ...formState.chartData.map(
                    (item) => parseFloat(item[ formState.discountedDataKey ]) || 0,
                ),
            );
            // console.log("maxDiscountedPricing:", maxDiscountedPricing);
            setMaxValue(Math.max(maxInitialPricing, maxDiscountedPricing));
            setFormState((prevState) => ({
                ...prevState,
                discountedAmount: totalDiscountedAmount,
                marginAfterDiscounting: marginAfterDiscounting,
                marginLostAfterDiscount: marginLostAfterDiscount
            }));
        } else {
            setMaxValue(0);
        }
    }, [ formState.chartData, formState.offers ]);


    function renderOfferAnalysisRows() {
        // console.log("renderOfferAnalysisRowsoffers:", formState.offers);
        if (formState.renderTable) {
            if (formState.offers.length > 0) {
                // console.log("formState.subDiscountrenderOfferAnalysisRows:", formState.subDiscount);
                return (
                    <MarginAnalyzerRows
                        offers={formState.offers}
                        subDiscount={formState.subDiscount}
                        marginAfterDiscounting={formState.marginAfterDiscounting}
                        marginLostAfterDiscount={formState.marginLostAfterDiscount}
                        currencySymbol={formState.currencySymbol}
                        aov={formState.aov}
                        chartData={formState.chartData}
                        initialDataKey={formState.initialDataKey}
                        discountedDataKey={formState.discountedDataKey}
                    />
                );
            }
        }
    }

    const getModalWidth = () => {
        const minWidth = 600;
        const widthPerProduct = 60;
        return Math.max(
            minWidth,
            formState.chartData?.length * widthPerProduct || minWidth,
        );
    };

    function renderMarginTable() {
        let numDiscountedCategories = 0;
        let totalDiscountedQty = 0;
        let totalDiscountedAmount = formState.discountedAmount; // Get the total discounted amount

        // console.log("finaloffer:", formState.offers);
        if (formState.offers[ formState.offers.length - 1 ]) {
            // console.log("rendermargintablequantity:", formState.offers[ formState.offers.length - 1 ].quantity);
            // console.log("rendermargintablediscountamount:", formState.offers[ formState.offers.length - 1 ].discountAmount);

            if (!formState.offers[ formState.offers.length - 1 ].quantity === "" && !formState.offers[ formState.offers.length - 1 ].discountAmount === "") {
                // console.log("finaloffer:", formState.offers);
            }

            if (formState.renderTable) {
                // console.log("formState.totalDiscountedQtyNaN:", formState.totalDiscountedQty);
                if (formState.type === "product") {
                    numDiscountedCategories = formState.products.length;
                    totalDiscountedQty = formState.totalDiscountedQty * formState.products.length;
                } else if (formState.type === "collection") {
                    numDiscountedCategories = formState.collections.length;
                    totalDiscountedQty = formState.totalDiscountedQty * formState.collections.length;
                }
            }
            // console.log("numDiscountedCategories:", numDiscountedCategories);
        }

        return (
            <MarginAnalyzer
                numDiscountedCategories={numDiscountedCategories}
                totalDiscountedQty={totalDiscountedQty}
                totalDiscountedAmount={totalDiscountedAmount}
                selectionType={formState.type}
            />
        );
    }

    const toggleModal = () => {
        setModalActive(!modalActive);
    };

    const toggleChartType = () => {
        setShowLineChart(!showLineChart);
    };


    const ChartComponent = showLineChart ? LineChart : BarChart;
    const InitialPricingComponent = showLineChart ? Line : Bar;
    const DiscountedPricingComponent = showLineChart ? Line : Bar;

    return <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
        <Card>
            <div
                style={{
                    marginBottom: "10px",
                    textAlign: "center",
                    fontWeight: "bold",
                }}
            >
                Pricing Analysis: Initial Vs Discounted
            </div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    alignItems: "center",
                }}
            >
                <ButtonGroup segmented>
                    <Button onClick={toggleChartType}>
                        {showLineChart ? "View Bar Chart" : "View Line Chart"}
                    </Button>
                </ButtonGroup>
                <Button onClick={toggleModal} primary>
                    <Icon source={modalActive ? MinimizeIcon : MaximizeIcon} />
                </Button>
            </div>
            <div onClick={toggleModal}>
                <ResponsiveContainer width="100%" height={400}>
                    <ChartComponent
                        data={formState.chartData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 35,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis domain={[ 0, maxValue ]} />
                        <Tooltip />
                        <InitialPricingComponent
                            dataKey={formState.initialDataKey}
                            fill="#8884d8"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ strokeWidth: 2 }}
                        />
                        <DiscountedPricingComponent
                            dataKey={formState.discountedDataKey}
                            fill="#FFA500"
                            stroke="#FFA500"
                            strokeWidth={2}
                            dot={{ strokeWidth: 2 }}
                        />
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
            {renderMarginTable()}
            {renderOfferAnalysisRows()}
            <Modal
                open={modalActive}
                onClose={toggleModal}
                title="Pricing Analysis: Initial Vs Discounted"
                large
            >
                <Modal.Section>
                    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                        <div style={{ width: getModalWidth() + "px" }}>
                            <ResponsiveContainer width="100%" height={400}>
                                <ChartComponent
                                    data={formState.chartData}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 35,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis domain={[ 0, maxValue ]} />
                                    <Tooltip />
                                    <InitialPricingComponent
                                        dataKey={formState.initialDataKey}
                                        fill="#8884d8"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ strokeWidth: 2 }}
                                    />
                                    <DiscountedPricingComponent
                                        dataKey={formState.discountedDataKey}
                                        fill="#FFA500"
                                        stroke="#FFA500"
                                        strokeWidth={2}
                                        dot={{ strokeWidth: 2 }}
                                    />
                                </ChartComponent>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Modal.Section>
            </Modal>
        </Card>
    </Grid.Cell>
}

export default visualPanal
