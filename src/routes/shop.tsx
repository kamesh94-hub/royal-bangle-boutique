import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { SlidersHorizontal } from "lucide-react";
import { z } from "zod";

import { CatalogEmptyState } from "@/components/catalog-empty-state";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { formatINR, shopifyProductsQueryOptions, type ShopifyProduct } from "@/lib/shopify-storefront";

const shopSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).optional(),
});

type ShopSearch = z.infer<typeof shopSearchSchema>;
type SortOption = NonNullable<ShopSearch["sort"]>;

const categoryOptions = ["Bridal", "Silk Thread", "Glass", "Gold Plated", "Daily Wear", "Terracotta", "Customized"];
const colorOptions = ["Red", "Green", "Gold", "Pink", "Silver", "Multicolor"];
const materialOptions = ["Brass", "Copper", "Glass", "Silk Thread", "Terracotta"];
const sizeOptions = ["2.2", "2.4", "2.6", "2.8", "2.10"];

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(shopSearchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopifyProductsQueryOptions),
  component: ShopPage,
  errorComponent: () => (
    <main className="page-container py-20 text-center">
      <h1 className="font-display text-3xl">The collection could not load</h1>
      <p className="mt-3 text-muted-foreground">Please try again in a moment.</p>
    </main>
  ),
  notFoundComponent: () => <main className="page-container py-20 text-center">No products found</main>,
  head: () => ({
    meta: [
      { title: "Shop Bangles | ISHWARIYAM FANCY BANGLES" },
      { name: "description", content: "Browse Indian bangle sets by collection, colour, material and size at ISHWARIYAM FANCY BANGLES." },
      { property: "og:title", content: "Shop Bangles | ISHWARIYAM FANCY BANGLES" },
      { property: "og:description", content: "Browse Indian bangle sets by collection, colour, material and size." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function productSearchText(product: ShopifyProduct): string {
  return [
    product.title,
    product.description,
    product.productType,
    ...product.tags,
    ...product.options.flatMap((option) => [option.name, ...option.values]),
    ...product.variants.flatMap((variant) => [variant.title, ...variant.selectedOptions.map((option) => option.value)]),
  ].join(" ").toLowerCase();
}

function priceOf(product: ShopifyProduct): number {
  return Number(product.priceRange.minVariantPrice.amount);
}

function ShopPage() {
  const { data: products } = useSuspenseQuery(shopifyProductsQueryOptions);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const priceCeiling = Math.max(1000, ...products.map(priceOf));

  const updateSearch = (patch: Partial<ShopSearch>) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }) });
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const text = productSearchText(product);
      if (search.q && !text.includes(search.q.toLowerCase())) return false;
      if (search.category && !text.includes(search.category.toLowerCase())) return false;
      if (search.color && !text.includes(search.color.toLowerCase())) return false;
      if (search.material && !text.includes(search.material.toLowerCase())) return false;
      if (search.size && !product.variants.some((variant) =>
        variant.selectedOptions.some((option) => option.value === search.size),
      )) return false;
      if (search.maxPrice !== undefined && priceOf(product) > search.maxPrice) return false;
      return true;
    });

    const sort = search.sort ?? "featured";
    if (sort === "price-asc") result.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "price-desc") result.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "newest") result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [products, search]);

  const filters = (
    <FilterFields
      search={search}
      priceCeiling={priceCeiling}
      updateSearch={updateSearch}
      clearFilters={() => void navigate({ search: {} })}
    />
  );

  return (
    <main className="page-container min-h-[70vh] py-10 sm:py-14">
      <div className="mb-8 text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Shop</div>
      <div className="section-heading-row items-end">
        <div>
          <p className="eyebrow">The collection</p>
          <h1 className="section-title">Bangles for every occasion</h1>
          <p className="mt-3 text-sm text-muted-foreground">{filteredProducts.length} pieces</p>
        </div>
        <div className="flex items-center gap-3">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden"><SlidersHorizontal aria-hidden="true" /> Filters</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,24rem)] overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-2xl">Refine your search</SheetTitle></SheetHeader>
              <div className="mt-7">{filters}</div>
            </SheetContent>
          </Sheet>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Sort</span>
            <select
              aria-label="Sort products"
              value={search.sort ?? "featured"}
              onChange={(event) => updateSearch({ sort: event.target.value as SortOption })}
              className="h-10 min-w-36 border border-input bg-background px-3 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-9 grid gap-9 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        {filteredProducts.length ? (
          <div className="product-grid self-start">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="lg:col-start-2">
            {products.length === 0 ? <CatalogEmptyState /> : (
              <div className="catalog-empty-state">
                <h2 className="font-display text-2xl">No products found</h2>
                <p className="mt-2 text-sm text-muted-foreground">Try removing a filter or changing your search.</p>
                <Button className="mt-5" variant="outline" onClick={() => void navigate({ search: {} })}>Clear filters</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function FilterFields({
  search,
  priceCeiling,
  updateSearch,
  clearFilters,
}: {
  search: ShopSearch;
  priceCeiling: number;
  updateSearch: (patch: Partial<ShopSearch>) => void;
  clearFilters: () => void;
}) {
  const selectField = (label: string, value: string | undefined, options: string[], onChange: (value: string | undefined) => void) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-10 w-full border border-input bg-background px-3 text-sm"
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {selectField("Category", search.category, categoryOptions, (category) => updateSearch({ category }))}
      {selectField("Bangle size", search.size, sizeOptions, (size) => updateSearch({ size }))}
      {selectField("Colour", search.color, colorOptions, (color) => updateSearch({ color }))}
      {selectField("Material", search.material, materialOptions, (material) => updateSearch({ material }))}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Price range</Label>
          <span className="text-xs text-muted-foreground">Up to {formatINR(search.maxPrice ?? priceCeiling)}</span>
        </div>
        <Slider
          value={[Math.min(search.maxPrice ?? priceCeiling, priceCeiling)]}
          min={0}
          max={priceCeiling}
          step={Math.max(1, Math.round(priceCeiling / 100))}
          onValueChange={(values) => {
            const value = values[0];
            if (value !== undefined) updateSearch({ maxPrice: value });
          }}
          aria-label="Maximum price"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹0</span><span>{formatINR(priceCeiling)}</span>
        </div>
      </div>
      <Button type="button" variant="ghost" className="px-0" onClick={clearFilters}>Clear all filters</Button>
    </div>
  );
}