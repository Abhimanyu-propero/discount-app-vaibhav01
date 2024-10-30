import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({ showForm: Boolean(login) });
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.logoContainer}>
        <img src="https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/r6npqhkmy1rmw3t5usmx" alt="Company Logo" className={styles.companyLogo} />
        <img src="https://www.propero.in/cdn/shop/t/36/assets/discount-logo.png?v=12629476215465604241717149824" alt="App Logo" className={styles.appLogo} />
      </div>
      <div className={styles.content}>
        <h1 className={styles.heading}>
          Smart Discount App
        </h1>
        <h2 className={styles.subheading}>
          A game-changing solution for Shopify merchants
        </h2>
        <p className={styles.text}>
          We aim to revolutionize discount strategies for stores and merchant businesses by leveraging cutting-edge analytical solutions. Our Smart Discount app offers data-driven insights to help merchants make informed decisions when setting up discount campaigns for products and collections on Shopify.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" placeholder="e.g: my-shop-domain.myshopify.com" />
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
      </div>
      <ul className={styles.list}>
        <li>
          <h3>Discounting Campaign Creation</h3>
          <p>Add Campaign name, Discount type: Volume, BOGO, Spend amount, Free shipping. Add multiple products & collections with quantities and desired discount percentage.</p>
        </li>
        <li>
          <h3>Dynamic Pre-Sales Campaign Analysis</h3>
          <p>Generate dynamic pricing charts, analyze total discount percentages, amounts, and product counts. Set margin losses and threshold limits for profitability.</p>
        </li>
        <li>
          <h3>Discount Campaign Analysis</h3>
          <p>Real-time analysis of discount campaign analytics including selected discounted products, total discounted amounts, total margin & AOV calculations.</p>
        </li>
        <li>
          <h3>Campaign-wise After-sales Analytics</h3>
          <p>Generate real-time campaign-wise analytics for desired campaigns to review the performance of specific discount campaigns.</p>
        </li>
      </ul>
    </div>
  );
}
