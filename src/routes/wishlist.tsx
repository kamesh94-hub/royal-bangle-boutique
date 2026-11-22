import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { CatalogEmptyState } from "@/components/catalog-empty-state";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { shopifyProductsQueryOptions } from "@/lib/shopify-storefront";
import { useWishlist } from "@/hooks/use-wishlist";

export const Route = createFileRoute("/wishlist")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopifyProductsQueryOptions),
  component: WishlistPage,
  errorComponent: () => <main className="page-container py-20 text-center">Your saved pieces could not load.</main>,
  notFoundComponent: () => <main className="page-container py-20 text-center">No products found</main>,
  head: () => ({
    meta: [
      { title: "Your Wishlist | ISHWARIYAM FANCY BANGLES" },
      { name: "description", content: "Return to the bangle pieces you have saved at ISHWARIYAM FANCY BANGLES." },
      { property: "og:title", content: "Your Wishlist | ISHWARIYAM FANCY BANGLES" },
      { property: "og:description", content: "Your saved bangle pieces, together in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function WishlistPage() {
  const { data: products } = useSuspenseQuery(shopifyProductsQueryOptions);
  const { productIds } = useWishlist();
  const savedProducts = products.filter((product) => productIds.includes(product.id));

  return (
    <main className="page-container min-h-[65vh] py-12 sm:py-16">
      <p className="eyebrow">Kept close</p>
      <h1 className="section-title mt-2">Your wishlist</h1>
      {savedProducts.length ? (
        <div className="product-grid mt-9">
          {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8"><CatalogEmptyState /></div>
      ) : (
        <div className="catalog-empty-state mt-8">
          <Heart aria-hidden="true" className="mx-auto size-7 text-primary" />
          <h2 className="mt-4 font-display text-2xl">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">Save the pieces you would love to return to.</p>
          <Button asChild className="mt-5"><Link to="/shop">Explore the collection</Link></Button>
        </div>
      )}
    </main>
  );
}