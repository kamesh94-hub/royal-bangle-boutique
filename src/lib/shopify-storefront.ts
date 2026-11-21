import { queryOptions } from "@tanstack/react-query";

const SHOPIFY_API_VERSION = "2026-10";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "royal-bangle-boutique-g9wow-9dv3n8ng.myshopify.com";
const SHOPIFY_STOREFRONT_TOKEN = "0705f029f71687975868807627cc7e72";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  availableForSale: boolean;
  selectedOptions: ShopifySelectedOption[];
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  productType: string;
  tags: string[];
  createdAt: string;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: Array<{ name: string; values: string[] }>;
}

interface ShopifyProductResponse extends Omit<ShopifyProduct, "images" | "variants"> {
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
}

interface ShopifyGraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

export async function storefrontApiRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`The store catalog could not be reached (${response.status}).`);
  }

  const payload = (await response.json()) as ShopifyGraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(
      payload.errors.map((error) => error.message ?? "Store request failed.").join(" "),
    );
  }
  if (!payload.data) {
    throw new Error("The store returned no catalog data.");
  }

  return payload.data;
}

const PRODUCT_FIELDS = `
  id
  title
  description
  handle
  productType
  tags
  createdAt
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  images(first: 8) {
    edges { node { url altText } }
  }
  variants(first: 100) {
    edges {
      node {
        id
        title
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        availableForSale
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

function normalizeProduct(product: ShopifyProductResponse): ShopifyProduct {
  return {
    ...product,
    images: product.images.edges.map((edge) => edge.node),
    variants: product.variants.edges.map((edge) => edge.node),
  };
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest<{
    products: { edges: Array<{ node: ShopifyProductResponse }> };
  }>(`query StorefrontProducts { products(first: 60) { edges { node { ${PRODUCT_FIELDS} } } } }`);

  return data.products.edges.map((edge) => normalizeProduct(edge.node));
}

export async function fetchShopifyProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest<{ product: ShopifyProductResponse | null }>(
    `query StorefrontProduct($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
  );

  return data.product ? normalizeProduct(data.product) : null;
}

export const shopifyProductsQueryOptions = queryOptions({
  queryKey: ["shopify", "products"],
  queryFn: fetchShopifyProducts,
  staleTime: 60_000,
});

export const shopifyProductQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchShopifyProduct(handle),
    staleTime: 60_000,
  });

export function formatShopifyCheckoutUrl(checkoutUrl: string): string {
  const url = new URL(checkoutUrl);
  url.searchParams.set("channel", "online_store");
  return url.toString();
}

export function formatINR(amount: string | number, currencyCode = "INR"): string {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}