// Deliberately not a "use client" module: a server component importing a
// constant across that boundary gets a client-reference proxy rather than the
// value, and only finds out at runtime.

// The product name. Client may rename later — change it here and nowhere else.
export const APP_NAME = "SAMS CMS";

/** The status dropdowns, in the order they are offered. The form and the view
    pages read the same list, so the two cannot fall out of step; they mirror the
    QuotationStatus and BillStatus enums in the schema. */
export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
export const BILL_STATUSES = ["DRAFT", "ISSUED", "PAID", "CANCELLED"];
