import { Page, LegacyCard, List } from "@shopify/polaris";
import React from "react";

export const WinningProduct = ({ winningProduct }) => {
  if (!winningProduct || winningProduct.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>
          No winning product found
        </h1>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#000000' }}>
        Best Selling Products
      </h1>
      <div style={contentStyle}>
        <List type="bullet" style={{ color: "#000000" }}>
          {winningProduct.map((wp, index) => (
            <List.Item key={index} style={{ color: "#000000" }}>
              <b>{wp}</b>  
            </List.Item>
          ))}
        </List>
      </div>
    </div>
  );
}

const contentStyle = {
  maxHeight: "100px",            // Control content height
  overflowY: "auto",             // Enable vertical scrolling if content exceeds height
  padding: "15px",               // Add padding around the content
  paddingTop: "10px",            // Additional top padding for space from heading
  color: "#000000",              // Apply color to the whole content area
};  
