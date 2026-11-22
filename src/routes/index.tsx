import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Heart, Ruler } from "lucide-react";

import editorialImage from "@/assets/ishwariyam-bangle-editorial.png";
import antiqueImage from "@/assets/category-antique-gold.png";
import customImage from "@/assets/category-custom-bangles.png";
import glassImage from "@/assets/category-glass-bangles.png";
import silkImage from "@/assets/category-silk-thread.png";
import { CatalogEmptyState } from "@/components/catalog-empty-state";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { BANGLE_SIZE_GUIDE } from "@/lib/bangle-sizes";
import { shopifyProductsQueryOptions } from "@/lib/shopify-storefront";

const categories = [
  { title: "Bridal", subtitle: "For the grandest days", category: "Bridal", image: antiqueImage },
  { title: "Silk thread", subtitle: "Colour with a handcrafted touch", category: "Silk Thread", image: silkImage },
  { title: "Glass bangles", subtitle: "A little music in every movement", category: "Glass", image: glassImage },
  { title: "Custom pieces", subtitle: "Made personal, made memorable", category: "Customized", image: customImage },
];

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopifyProductsQueryOptions),
  component: Index,
  errorComponent: () => (
    <main className="page-container py-20 text-center">
      <h1 className="font-display text-3xl">The collection is taking a moment</h1>
      <p className="mt-3 text-muted-foreground">Please refresh to see the latest pieces.</p>
    </main>
  ),
  notFoundComponent: () => <main className="page-container py-20 text-center">No products found</main>,
  head: () => ({
    meta: [
      { title: "ISHWARIYAM FANCY BANGLES | Indian Bangle Artistry" },
      { name: "description", content: "Discover Indian bangle artistry for celebrations, traditions and everyday adornment at ISHWARIYAM FANCY BANGLES." },
      { property: "og:title", content: "ISHWARIYAM FANCY BANGLES | Indian Bangle Artistry" },
      { property: "og:description", content: "Discover Indian bangle artistry for celebrations, traditions and everyday adornment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { data: products } = useSuspenseQuery(shopifyProductsQueryOptions);
  const [selectedSize, setSelectedSize] = useState("2.6");
  const featuredProducts = products.slice(0, 4);

  return (
    <main>
      <section className="hero-banner" aria-labelledby="hero-title">
        <img src={editorialImage} alt="A festive arrangement of Indian bangles in warm gold and jewel tones" className="hero-photo" />
        <div className="hero-wash" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">Tradition, treasured</p>
          <h1 id="hero-title" className="font-display">ISHWARIYAM<br />FANCY BANGLES</h1>
          <p className="hero-description">Adornment for every celebration, crafted to be part of your story.</p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/shop">Shop collection <ArrowRight aria-hidden="true" /></Link>
          </Button>
          <a href="#shop-by-category" className="hero-scroll" aria-label="Scroll to shop by category">
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="shop-by-category" className="section-band page-container py-16 sm:py-20">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Find your expression</p>
            <h2 className="section-title">Shop by category</h2>
          </div>
          <Link to="/shop" className="text-link hidden sm:inline-flex">View all <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="category-grid mt-9">
          {categories.map((category) => (
            <Link
              key={category.title}
              to="/shop"
              search={{ category: category.category }}
              className="category-tile"
            >
              <div className="category-arch">
                <img src={category.image} alt={`${category.title} bangle inspiration`} loading="lazy" />
              </div>
              <h3 className="mt-4 font-display text-xl">{category.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{category.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="collection-band py-16 sm:py-20">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">From the collection</p>
              <h2 className="section-title">Pieces for your next occasion</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/shop">Explore all <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          {featuredProducts.length ? (
            <div className="product-grid mt-9">
              {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="mt-8"><CatalogEmptyState compact /></div>
          )}
        </div>
      </section>

      <section id="size-guide" className="size-guide-section page-container py-16 sm:py-20">
        <div className="size-guide-copy">
          <p className="eyebrow">A comfortable fit matters</p>
          <h2 className="section-title">Find your bangle size</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
            Choose a size you already wear, or compare the inner diameter with a bangle that fits you well.
          </p>
          <div className="mt-7 flex flex-wrap gap-2" aria-label="Choose a bangle size">
            {BANGLE_SIZE_GUIDE.map((item) => (
              <Button
                key={item.size}
                type="button"
                variant={selectedSize === item.size ? "default" : "outline"}
                aria-pressed={selectedSize === item.size}
                onClick={() => setSelectedSize(item.size)}
              >
                {item.size}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            Size {selectedSize} · approximately {BANGLE_SIZE_GUIDE.find((item) => item.size === selectedSize)?.diameterMm} mm inner diameter
          </p>
          <Button asChild variant="link" className="mt-3 px-0">
            <Link to="/shop">Shop by size <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
        <div className="size-guide-art" aria-hidden="true">
          <div className="size-art-circle"><Ruler className="size-10" /></div>
          <span className="size-art-caption">Measure across the inside<br />of a bangle that fits.</span>
        </div>
      </section>

      <section className="atelier-band py-16 sm:py-20">
        <div className="page-container">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">A little colour, a lot of feeling</p>
              <h2 className="section-title">The ISHWARIYAM edit</h2>
            </div>
            <Link to="/shop" className="text-link hidden sm:inline-flex">Discover the collection <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="atelier-gallery mt-9">
            {[silkImage, glassImage, customImage].map((image, index) => (
              <Link to="/shop" key={image} className={`atelier-frame atelier-frame-${index + 1}`}>
                <img src={image} alt="Indian bangle artistry from the ISHWARIYAM collection" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="customer-notes page-container py-16 sm:py-20">
        <div className="customer-notes-mark"><Heart aria-hidden="true" /></div>
        <p className="eyebrow">A story still being written</p>
        <h2 className="section-title mt-2">A note from you</h2>
        <p className="mt-3 text-sm text-muted-foreground">No customer notes yet.</p>
      </section>
    </main>
  );
}