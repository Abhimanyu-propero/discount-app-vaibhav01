import { Page, LegacyCard } from "@shopify/polaris";
import React from "react";

export const TotalOrders=({ totalOrders })=>{
  // return (
  //  <>
  //   <text>Total Orders</text>
  //  </>
  // );
  return (
    <Page fullWidth>
    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>
      <strong>Number Of Discounted Orders</strong>
    </h1>
    <p style={{ 
      fontSize: '19px', 
      fontWeight: 'bold',
      marginTop: '20px',
      color: '#000000',
          justifyContent:'center',
          alignContent:'center',
      // This adds space between h1 and p
      
    }}>
      {totalOrders}
    </p>
    {/*rest aov logic will be written here*/}
  </Page>
  );
}
