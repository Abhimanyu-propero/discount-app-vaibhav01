import { Page, LegacyCard } from "@shopify/polaris";
import React from "react";

export const TotalSales=({ totalSales })=>{
  // return (
  //   <> <text>Total Sales</text></>
   
  // )
  return (
    <Page fullWidth>
    <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#000000' }}>
      <strong>Total Sales</strong>
    </h1>
    <p style={{ 
      fontSize: '19px', 
      fontWeight: 'bold',
      marginTop: '20px' ,// This adds space between h1 and p
      color: '#000000',
          justifyContent:'center',
          alignContent:'center',
    }}>
      {totalSales}
    </p>
    {/*rest aov logic will be written here*/}
  </Page>
  );
}
