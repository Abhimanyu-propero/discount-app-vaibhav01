import db from "../db.server"
export function validateForm(data) {
    const errors = {};

    if (!data.offerName) {
        errors.offerName = "Offer Name is required";
    }
    if ((data.offerName).length <= 3 || (data.offerName).length >= 40) {
        errors.offerName = "Offer Name should be between 3 and 40 characters only";
    }
    if (!data.offerType) {
        errors.offerType = "Discount Type is required";
    }

    if (data.products.length === 0) {
        errors.products = "Products are required";
    }

    if (data.offers.length === 0) {
        errors.offers = "Offers are required";
    }

    if (!data.startDate) {
        errors.startDate = "Start date is required";
    }

    if (!data.endDate) {
        errors.endDate = "End Date is required";
    }

    if (Object.keys(errors).length) {
        return errors;
    }

}

export async function getDiscountTable(id) {
    const discount = await db.discountTable.findFirst({ where: { id } });
    if (!discount) {
        return null;
    };
    return discount;
};

export async function getDiscounts(shop) {
    const allDiscount = await db.discountTable.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" } // Order by createdAt in descending order
    });

    if (allDiscount.length === 0) { // Use length property to check if the array is empty
        return [];
    }

    return allDiscount;
}

