export interface MappableItem {
  type: "product" | "variant";
  id: string;
}

export interface ProductWithVariants {
  id: string;
  permalink?: string;
}

export interface SalesFilters {
  includedItems: MappableItem[];
  excludedItems: MappableItem[];
  minimumAmount: number | null;
  maximumAmount: number | null;
  createdAfter: string | null;
  createdBefore: string | null;
  country: string | null;
}

export interface EmailParamsResult {
  queryParams: Record<string, string | null>;
}

export function convertSalesFiltersToEmailParams(
  filters: SalesFilters,
  products: ProductWithVariants[],
  ignoredFilters: string[],
): EmailParamsResult {
  const boughtPermalinksOrIds: string[] = [];
  filters.includedItems.forEach((item) => {
    if (item.type === "product") {
      const p = products.find((prod) => prod.id === item.id);
      if (p?.permalink) boughtPermalinksOrIds.push(p.permalink);
    } else if (item.type === "variant") {
      boughtPermalinksOrIds.push(item.id);
    }
  });

  const notBoughtPermalinksOrIds: string[] = [];
  filters.excludedItems.forEach((item) => {
    if (item.type === "product") {
      const p = products.find((prod) => prod.id === item.id);
      if (p?.permalink) notBoughtPermalinksOrIds.push(p.permalink);
    } else if (item.type === "variant") {
      notBoughtPermalinksOrIds.push(item.id);
    }
  });

  const queryParams: Record<string, string | null> = {
    audience_type: "customers",
    bought: boughtPermalinksOrIds.join(","),
    not_bought: notBoughtPermalinksOrIds.join(","),
    paid_more_than_cents: filters.minimumAmount?.toString() ?? null,
    paid_less_than_cents: filters.maximumAmount?.toString() ?? null,
    created_after: filters.createdAfter,
    created_before: filters.createdBefore,
    bought_from: filters.country,
    ignored_filters: ignoredFilters.length > 0 ? ignoredFilters.join(",") : null,
  };

  return { queryParams };
}

export function getUnsupportedFilters(filters: {
  activeCustomersOnly: boolean;
  minimumLicenseUses: number | null;
  searchQuery: string | null;
}): string[] {
  const ignored: string[] = [];
  if (filters.activeCustomersOnly) ignored.push("Active customers only");
  if (filters.minimumLicenseUses !== null) ignored.push("Minimum license uses");
  if (filters.searchQuery) ignored.push("Search query");
  return ignored;
}
