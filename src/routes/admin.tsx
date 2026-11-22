import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Boxes, ClipboardList, IndianRupee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHOPIFY_ADMIN_URL, shopifyProductsQueryOptions } from "@/lib/shopify-storefront";

export const Route = createFileRoute("/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopifyProductsQueryOptions),
  component: AdminPage,
  errorComponent: () => <main className="page-container py-20 text-center">The store summary could not load.</main>,
  notFoundComponent: () => <main className="page-container py-20 text-center">Store data is unavailable.</main>,
  head: () => ({
    meta: [
      { title: "Store Management | ISHWARIYAM FANCY BANGLES" },
      { name: "description", content: "Manage ISHWARIYAM FANCY BANGLES products, orders and sales through Shopify." },
      { property: "og:title", content: "Store Management | ISHWARIYAM FANCY BANGLES" },
      { property: "og:description", content: "Manage products, orders and sales through Shopify." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminPage() {
  const { data: products } = useSuspenseQuery(shopifyProductsQueryOptions);

  return (
    <main className="page-container min-h-[70vh] py-12 sm:py-16">
      <p className="eyebrow">Store management</p>
      <h1 className="section-title mt-2">ISHWARIYAM at a glance</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Your catalog, order status and sales remain in Shopify, so changes here stay in sync with the live store.
      </p>

      <section className="admin-summary-grid mt-9" aria-label="Store summary">
        <article className="admin-summary-item">
          <Boxes aria-hidden="true" />
          <div><p className="text-sm text-muted-foreground">Catalog products</p><p className="mt-1 text-2xl font-semibold">{products.length}</p></div>
          <Button asChild variant="outline" size="sm"><a href={`${SHOPIFY_ADMIN_URL}/products`} target="_blank" rel="noreferrer">Manage products <ArrowUpRight aria-hidden="true" /></a></Button>
        </article>
        <article className="admin-summary-item">
          <ClipboardList aria-hidden="true" />
          <div><p className="text-sm text-muted-foreground">Orders</p><p className="mt-1 font-display text-xl">View live orders</p></div>
          <Button asChild variant="outline" size="sm"><a href={`${SHOPIFY_ADMIN_URL}/orders`} target="_blank" rel="noreferrer">Open orders <ArrowUpRight aria-hidden="true" /></a></Button>
        </article>
        <article className="admin-summary-item">
          <IndianRupee aria-hidden="true" />
          <div><p className="text-sm text-muted-foreground">Sales</p><p className="mt-1 font-display text-xl">View live sales</p></div>
          <Button asChild variant="outline" size="sm"><a href={`${SHOPIFY_ADMIN_URL}/analytics`} target="_blank" rel="noreferrer">Open analytics <ArrowUpRight aria-hidden="true" /></a></Button>
        </article>
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <div className="section-heading-row">
          <div><p className="eyebrow">Catalog</p><h2 className="font-display text-2xl">Products in this storefront</h2></div>
          <Button asChild><a href={`${SHOPIFY_ADMIN_URL}/products/new`} target="_blank" rel="noreferrer">Add a product <ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
        {products.length ? (
          <ul className="admin-product-list mt-6">
            {products.map((product) => {
              const adminProductId = product.id.split("/").at(-1);
              return (
                <li key={product.id}>
                  <div><p className="font-medium">{product.title}</p><p className="mt-1 text-xs text-muted-foreground">{product.variants.length} variants</p></div>
                  {adminProductId && <Button asChild variant="outline" size="sm"><a href={`${SHOPIFY_ADMIN_URL}/products/${adminProductId}`} target="_blank" rel="noreferrer">Edit in Shopify <ArrowUpRight aria-hidden="true" /></a></Button>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 border-y border-border py-8 text-sm text-muted-foreground">No products are published to this storefront yet. Add products in Shopify to make them available here.</p>
        )}
      </section>
    </main>
  );
}