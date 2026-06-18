import { describe, it, expect } from "vitest";

import { convertSalesFiltersToEmailParams, getUnsupportedFilters } from "$app/utils/audience";

describe("getUnsupportedFilters", () => {
  it("returns an empty array when no unsupported filters are active", () => {
    const result = getUnsupportedFilters({
      activeCustomersOnly: false,
      minimumLicenseUses: null,
      searchQuery: null,
    });
    expect(result).toEqual([]);
  });

  it("identifies activeCustomersOnly as unsupported", () => {
    const result = getUnsupportedFilters({
      activeCustomersOnly: true,
      minimumLicenseUses: null,
      searchQuery: null,
    });
    expect(result).toEqual(["Active customers only"]);
  });

  it("identifies minimumLicenseUses as unsupported", () => {
    const result = getUnsupportedFilters({
      activeCustomersOnly: false,
      minimumLicenseUses: 5,
      searchQuery: null,
    });
    expect(result).toEqual(["Minimum license uses"]);
  });

  it("identifies searchQuery as unsupported", () => {
    const result = getUnsupportedFilters({
      activeCustomersOnly: false,
      minimumLicenseUses: null,
      searchQuery: "some query",
    });
    expect(result).toEqual(["Search query"]);
  });

  it("identifies multiple unsupported filters simultaneously", () => {
    const result = getUnsupportedFilters({
      activeCustomersOnly: true,
      minimumLicenseUses: 3,
      searchQuery: "test",
    });
    expect(result).toEqual(["Active customers only", "Minimum license uses", "Search query"]);
  });
});

describe("convertSalesFiltersToEmailParams", () => {
  const products = [
    { id: "prod_1", permalink: "product-one" },
    { id: "prod_2", permalink: "product-two" },
  ];

  it("maps empty/null sales filters to default email query parameters", () => {
    const result = convertSalesFiltersToEmailParams(
      {
        includedItems: [],
        excludedItems: [],
        minimumAmount: null,
        maximumAmount: null,
        createdAfter: null,
        createdBefore: null,
        country: null,
      },
      products,
    );

    expect(result.queryParams).toEqual({
      audience_type: "customers",
      bought: "",
      not_bought: "",
      paid_more_than_cents: null,
      paid_less_than_cents: null,
      created_after: null,
      created_before: null,
      bought_from: null,
    });
  });

  it("maps included and excluded products using their permalinks", () => {
    const result = convertSalesFiltersToEmailParams(
      {
        includedItems: [
          { type: "product", id: "prod_1" },
          { type: "variant", id: "var_1" },
        ],
        excludedItems: [
          { type: "product", id: "prod_2" },
          { type: "variant", id: "var_2" },
        ],
        minimumAmount: null,
        maximumAmount: null,
        createdAfter: null,
        createdBefore: null,
        country: null,
      },
      products,
    );

    expect(result.queryParams.bought).toBe("product-one,var_1");
    expect(result.queryParams.not_bought).toBe("product-two,var_2");
  });

  it("maps simple amount, date, and country filters correctly", () => {
    const result = convertSalesFiltersToEmailParams(
      {
        includedItems: [],
        excludedItems: [],
        minimumAmount: 1000,
        maximumAmount: 5000,
        createdAfter: "2026-01-01",
        createdBefore: "2026-06-01",
        country: "US",
      },
      products,
    );

    expect(result.queryParams.paid_more_than_cents).toBe("1000");
    expect(result.queryParams.paid_less_than_cents).toBe("5000");
    expect(result.queryParams.created_after).toBe("2026-01-01");
    expect(result.queryParams.created_before).toBe("2026-06-01");
    expect(result.queryParams.bought_from).toBe("US");
  });
});
