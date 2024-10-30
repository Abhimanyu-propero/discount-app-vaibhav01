import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Box,
  CalloutCard,
  Divider,
  Badge,
} from "@shopify/polaris";
import {
  getSubscriptionStatus,
  createSubscriptionMetafield,
} from "../models/Subscription.server";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";
import prisma from "../db.server";

const PricingCard = ({
  title,
  description,
  price,
  features,
  featuredText,
  button,
  frequency,
  isCurrentPlan,
  isDisabled,
}) => {
  return (
    <div
      style={{
        width: "18rem",
        boxShadow: isCurrentPlan 
          ? "0px 0px 15px 4px #BAE3FF"  // Blue shadow for current plan
          : featuredText 
            ? "0px 0px 15px 4px #CDFEE1" 
            : "none",
        borderRadius: ".75rem",
        position: "relative",
        zIndex: "0",
        marginTop: featuredText || isCurrentPlan ? "2rem" : "0",
        opacity: isDisabled && !isCurrentPlan ? "0.7" : "1",
      }}
    >
      {featuredText && !isDisabled && (
        <div
          style={{
            position: "absolute",
            top: "-15px",
            right: "6px",
            zIndex: "100",
          }}
        >
          <Badge size="large" tone="success">
            {featuredText}
          </Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div
          style={{
            position: "absolute",
            top: "-15px",
            left: "6px",
            zIndex: "100",
          }}
        >
          <Badge size="large" tone="info">
            Current Plan
          </Badge>
        </div>
      )}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200" align="start">
            <Text as="h3" variant="headingLg">
              {title}
            </Text>
            {description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {description}
              </Text>
            )}
          </BlockStack>

          <InlineStack blockAlign="end" gap="100" align="start">
            <Text as="h2" variant="heading2xl">
              {price}
            </Text>
            <Box paddingBlockEnd="200">
              <Text variant="bodySm">/ {frequency}</Text>
            </Box>
          </InlineStack>

          <BlockStack gap="100">
            {features?.map((feature, id) => (
              <Text 
                tone={isDisabled && !isCurrentPlan ? "subdued" : undefined} 
                as="p" 
                variant="bodyMd" 
                key={id}
              >
                {feature}
              </Text>
            ))}
          </BlockStack>

          {!isDisabled && (
            <Box paddingBlockStart="200" paddingBlockEnd="200">
              <Button
                {...button.props}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? "Current Plan" : button.content}
              </Button>
            </Box>
          )}
        </BlockStack>
      </Card>
    </div>
  );
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  if (!admin) {
    return redirect("/auth/login");
  }

  const shopRecord = await prisma.shopRecords.findFirst({
    where: { shop: session.shop },
  });

  if (!shopRecord) {
    return redirect("/auth/login");
  }

  // Check subscription status
  const subscriptions = await getSubscriptionStatus(admin.graphql);
  const { activeSubscriptions } = subscriptions.data.app.installation;

  let trialDaysLeft = 0;

  if (shopRecord.subscriptionType === "trial") {
    const now = new Date();
    const trialEnd = new Date(shopRecord.trialEndDate);
    trialDaysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (trialDaysLeft <= 0) {
      await prisma.shopRecords.update({
        where: { shop: session.shop },
        data: { subscriptionType: "expired" },
      });
      shopRecord.subscriptionType = "expired";
    }
  }

  // Update subscription status in database
  if (activeSubscriptions && activeSubscriptions.length > 0 && activeSubscriptions[0].status === "ACTIVE") {
    await createSubscriptionMetafield(admin.graphql, "true");
    await prisma.shopRecords.update({
      where: { shop: session.shop },
      data: { subscriptionType: activeSubscriptions[0].name },
    });
  } else {
    await createSubscriptionMetafield(admin.graphql, "false");
    // If no active subscription and not in trial, update to expired
    if (shopRecord.subscriptionType !== "trial") {
      await prisma.shopRecords.update({
        where: { shop: session.shop },
        data: { subscriptionType: "expired" },
      });
      shopRecord.subscriptionType = "expired";
    }
}
  return json({
    activeSubscriptions,
    trialDaysLeft,
    subscriptionType: shopRecord.subscriptionType,
    installationTime: shopRecord.installationTime,
  });
};

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const data = {
    ...Object.fromEntries(await request.formData()),
  };
  const action = data.action;
  const isTest = true;

  if (!action) {
    return null;
  }

  const PLAN = action === "monthly" ? MONTHLY_PLAN : ANNUAL_PLAN;

  if (data.cancel) {
    const billingCheck = await billing.require({
      plans: [PLAN],
      onFailure: async () => billing.request({ plan: PLAN }),
    });

    const subscription = billingCheck.appSubscriptions[0];

    // Cancel the subscription
    await billing.cancel({
      subscriptionId: subscription.id,
      isTest: isTest,
      prorate: true,
    });

    // Update the subscription status in the database
    const shopRecord = await prisma.shopRecords.findFirst({
      where: { shop: session.shop },
    });

    if (shopRecord) {
      await prisma.shopRecords.update({
        where: { shop: session.shop },
        data: { subscriptionType: "expired" },
      });
    }

    return redirect("/app/pricing");
  } else {
    await billing.require({
      plans: [PLAN],
      isTest: isTest,
      onFailure: async () => billing.request({ plan: PLAN, isTest: isTest }),
      returnUrl: `https://admin.shopify.com/store/${shop}/apps/${process.env.APP_NAME}/app/pricing`,
    });
  }

  return null;
};

export default function Pricing() {
  const { activeSubscriptions, trialDaysLeft, subscriptionType } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handlePurchaseAction = (subscription) => {
    subscription = subscription.split(" ")[0];
    submit({ action: subscription }, { method: "post" });
  };

  const handleCancelAction = (subscription) => {
    submit({ action: subscription, cancel: true }, { method: "post" });
  };

  const hasActiveSubscription =
    activeSubscriptions.length > 0 &&
    activeSubscriptions[0].status === "ACTIVE";

    const getCurrentPlanDisplay = () => {
      if (subscriptionType === "trial") {
        return `You have ${trialDaysLeft} days left in your free trial.`;
      } else if (subscriptionType === "expired" || !hasActiveSubscription) {
        return "You have no active subscription. Please upgrade to continue using the app.";
      } else {
        const planName = subscriptionType === "annual subscription" ? "Annual" : 
                        subscriptionType === "monthly subscription" ? "Monthly" : 
                        subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
        return `You're currently on the ${planName} plan.`;
      }
    };
  

  const planData = [
    {
      title: "Trial Plan",
      description:
        subscriptionType === "trial"
          ? `${trialDaysLeft} days left in your free trial`
          : "7-day free trial (Expired)",
      price: "$0",
      name: "Trial Subscription",
      frequency: "Trial Period",
      features: [
        "Unlimited discount campaigns, including volume discounts, BOGO, free shipping.",
        "Comprehensive analytics and profit margin analysis.",
        "Campaign analytics up to 100 orders.",
        "Dynamic charts for pricing strategies.",
      ],
    },
    {
      title: "Monthly Plan",
      description: "Cost: $19.99 - Billed Monthly",
      price: "$19.99",
      name: "Monthly Subscription",
      frequency: "month",
      features: [
        "Unlimited discount campaigns, including volume discounts, BOGO, free shipping.",
        "Comprehensive analytics and profit margin analysis.",
        "Campaign analytics up to 100 orders.",
        "Dynamic charts for pricing strategies.",
      ],
    },
    {
      title: "Yearly Plan",
      description: "Cost: $200 - Billed Annually",
      price: "$200",
      name: "Annual Subscription",
      frequency: "year",
      features: [
        "Unlimited discount campaigns, including volume discounts, BOGO, free shipping.",
        "Comprehensive analytics and profit margin analysis.",
        "Campaign analytics up to 100 orders.",
        "Dynamic charts for pricing strategies.",
      ],
      featuredText: "Best Value",
    },
  ];

  // Filter out trial plan if expired or has active subscription
  const visiblePlans = planData.filter(plan => {
    if (plan.name === "Trial Subscription") {
      return subscriptionType === "trial";
    }
    return true;
  });

  return (
    <Page>
      <BlockStack gap="800">
        <CalloutCard
          title="Your current plan"
          illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
          primaryAction={{
            content: !hasActiveSubscription ? "Upgrade Plan" : "Cancel Plan",
            onAction: !hasActiveSubscription
              ? () => handlePurchaseAction("monthly")
              : () => handleCancelAction(subscriptionType),
          }}
        >
          <p>{getCurrentPlanDisplay()}</p>
        </CalloutCard>

        <BlockStack gap="400">
          <Text variant="heading2xl" as="h1" alignment="center">
            Available Plans
          </Text>
          <Text variant="bodyLg" as="p" tone="subdued" alignment="center">
            Choose the plan that best fits your needs
          </Text>
        </BlockStack>

        <InlineStack gap="600" align="center" blockAlign="start">
          {visiblePlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              description={plan.description}
              price={plan.price}
              frequency={plan.frequency}
              features={plan.features}
              featuredText={plan.featuredText}
              isCurrentPlan={
                hasActiveSubscription && 
                subscriptionType.toLowerCase() === plan.name.toLowerCase()
              }
              isDisabled={
                (hasActiveSubscription && plan.name === "Trial Subscription") ||
                (subscriptionType === "expired" && plan.name === "Trial Subscription")
              }
              button={{
                content: "Select Plan",
                props: {
                  variant: "primary",
                  onClick: () => handlePurchaseAction(plan.name.toLowerCase()),
                },
              }}
            />
          ))}
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
