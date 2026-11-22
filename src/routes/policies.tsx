import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { shopifyStorePoliciesQueryOptions } from "@/lib/shopify-storefront";

export const Route = createFileRoute("/policies")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopifyStorePoliciesQueryOptions),
  component: PoliciesPage,
  errorComponent: () => <main className="page-container py-20 text-center">Store policies could not load right now.</main>,
  notFoundComponent: () => <main className="page-container py-20 text-center">No store policies are available.</main>,
  head: () => ({
    meta: [
      { title: "Shipping & Returns | ISHWARIYAM FANCY BANGLES" },
      { name: "description", content: "Read shipping, return and store policies for ISHWARIYAM FANCY BANGLES." },
      { property: "og:title", content: "Shipping & Returns | ISHWARIYAM FANCY BANGLES" },
      { property: "og:description", content: "Read shipping, return and store policies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PoliciesPage() {
  const { data: policies } = useSuspenseQuery(shopifyStorePoliciesQueryOptions);
  const entries = [
    policies.shippingPolicy,
    policies.refundPolicy,
    policies.termsOfService,
    policies.privacyPolicy,
  ].filter((policy): policy is NonNullable<typeof policy> => Boolean(policy));

  return (
    <main className="page-container min-h-[65vh] py-12 sm:py-16">
      <p className="eyebrow">Customer care</p>
      <h1 className="section-title mt-2">Store policies</h1>
      {entries.length ? (
        <div className="policy-list mt-9">
          {entries.map((policy) => (
            <section key={policy.title} className="policy-section">
              <h2 className="font-display text-2xl">{policy.title}</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{policy.body}</p>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 max-w-2xl border-y border-border py-7 text-sm leading-6 text-muted-foreground">
          Store policies have not been published yet. Delivery and payment options are confirmed during Shopify checkout.
        </p>
      )}
    </main>
  );
}