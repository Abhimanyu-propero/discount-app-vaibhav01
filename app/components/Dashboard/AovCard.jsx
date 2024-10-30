import { Page } from '@shopify/polaris';

export const AovCard = ({ aovValue }) => {
  return (
    <Page fullWidth>
      <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#00000' }}>
        <strong>Average Order Value</strong>
      </h1>
      <p
        style={{
          fontSize: '19px',
          fontWeight: 'bold',
          marginTop: '20px', // Adds space between h1 and p
          color: '#00000',
          justifyContent:'center',
          alignContent:'center',
          
         // Set the text color to purple
        }}
      >
        {aovValue}
      </p>
      {/*rest aov logic will be written here*/}
    </Page>
  );
};
