import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Minus, Plus, Ruler, ShoppingBag } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BANGLE_SIZE_GUIDE, getSizeOptionName } from "@/lib/bangle-sizes";
import { formatINR, shopifyProductQueryOptions, shopifyProductsQueryOptions } from "@/lib/shopify-storefront";
import { useCartStore } from "@/stores/cart";

export const Route = createFileRoute("/product/$handle")({
  loader: async ({ context, params }) => {
    const [product] = await Promise.all([
      context.queryClient.ensureQueryData(shopifyProductQueryOptions(params.handle)),
      context.queryClient.ensureQueryData(shopifyProductsQueryOptions),
    ]);
    if (!product) throw notFound();
    return product;
  },
  component: ProductPage,
  errorComponent: () => (
    <main className="page-container py-20 text-center">
      <h1 className="font-display text-3xl">This piece could not load</h1>
      <p className="mt-3 text-muted-foreground">Please return to the collection and try again.</p>
      <Button asChild className="mt-5"><Link to="/shop">Shop the collection</Link></Button>
    </main>
  ),
  notFoundComponent: () => (
    <main className="page-container py-20 text-center">
      <h1 className="font-display text-3xl">Piece not found</h1>
      <Button asChild className="mt-5"><Link to="/shop">Shop the collection</Link></Button>
    </main>
  ),
  head: ({ loaderData }) => {
    const product = loaderData;
    const imageUrl = product?.images[0]?.url;
    const hasAbsoluteImage = imageUrl?.startsWith("https://") ?? false;
    const title = `${product?.title ?? "Bangle"} | ISHWARIYAM FANCY BANGLES`;
    const description = product?.description.slice(0, 155) || "Explore Indian bangle artistry at ISHWARIYAM FANCY BANGLES.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(hasAbsoluteImage ? [
          { property: "og:image", content: imageUrl },
          { name: "twitter:image", content: imageUrl },
        ] : []),
      ],
    };
  },
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(shopifyProductQueryOptions(handle));
  const { data: allProducts } = useSuspenseQuery(shopifyProductsQueryOptions);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);
  const cartError = useCartStore((state) => state.error);

  if (!product) return null;

  const sizeOptionName = getSizeOptionName(product.options);
  const sizeValues = sizeOptionName
    ? product.options.find((option) => option.name === sizeOptionName)?.values ?? []
    : [];
  const selectedVariant = sizeOptionName
    ? product.variants.find((variant) =>
        variant.selectedOptions.some((option) => option.name === sizeOptionName && option.value === selectedSize),
      )
    : undefined;
  const activeImage = product.images[selectedImageIndex] ?? product.images[0];
  const canPurchase = Boolean(selectedVariant?.availableForSale);
  const relatedProducts = allProducts.filter((item) => item.id !== product.id).slice(0, 4);

  const makeCartItem = () => {
    if (!selectedVariant) return null;
    return {
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions,
    };
  };

  const handleAddToBag = async () => {
    const item = makeCartItem();
    if (item) await addItem(item);
  };

  const handleBuyNow = async () => {
    const item = makeCartItem();
    if (!item) return;
    const checkoutWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
    await addItem(item);
    const checkoutUrl = useCartStore.getState().getCheckoutUrl();
    if (checkoutUrl && !useCartStore.getState().error && checkoutWindow) {
      checkoutWindow.location.href = checkoutUrl;
    } else {
      checkoutWindow?.close();
    }
  };

  return (
    <main className="page-container py-9 sm:py-12">
      <div className="mb-7 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/shop" className="hover:text-primary">Shop</Link> / {product.title}
      </div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image">
            {activeImage ? (
              <img src={activeImage.url} alt={activeImage.altText ?? product.title} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Product image coming soon</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <Button
                  key={image.url}
                  type="button"
                  variant="ghost"
                  className={`product-thumbnail ${selectedImageIndex === index ? "product-thumbnail-active" : ""}`}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={selectedImageIndex === index}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image.url} alt={image.altText ?? `${product.title}, view ${index + 1}`} />
                </Button>
              ))}
            </div>
          )}
        </div>

        <section className="product-buy-panel" aria-labelledby="product-title">
          <p className="eyebrow">{product.productType || "The collection"}</p>
          <h1 id="product-title" className="mt-2 font-display text-3xl sm:text-4xl">{product.title}</h1>
          {selectedVariant?.sku && <p className="mt-2 text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>}
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-2xl font-semibold">{formatINR(selectedVariant?.price.amount ?? product.priceRange.minVariantPrice.amount, selectedVariant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode)}</p>
            {selectedVariant?.compareAtPrice && (
              <p className="text-sm text-muted-foreground line-through">
                {formatINR(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)}
              </p>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {selectedVariant ? (selectedVariant.availableForSale ? "Available to order" : "Currently sold out") : "Choose a size to see availability"}
          </p>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Choose size</p>
              <Dialog open={isSizeChartOpen} onOpenChange={setIsSizeChartOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="link" className="h-auto p-0 text-sm"><Ruler aria-hidden="true" /> Size chart</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Bangle size chart</DialogTitle>
                    <DialogDescription>Approximate inner diameter measurements.</DialogDescription>
                  </DialogHeader>
                  <div className="size-chart-table">
                    <div className="size-chart-row size-chart-heading"><span>Size</span><span>Diameter</span><span>Inches</span></div>
                    {BANGLE_SIZE_GUIDE.map((item) => (
                      <div key={item.size} className="size-chart-row"><span>{item.size}</span><span>{item.diameterMm} mm</span><span>{item.diameterInches}</span></div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {sizeValues.length ? (
              <div className="flex flex-wrap gap-2" aria-label="Available sizes">
                {sizeValues.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={selectedSize === size ? "default" : "outline"}
                    aria-pressed={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Size options have not been added to this product yet.</p>
            )}
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex h-11 items-center border border-input">
              <Button type="button" variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Minus aria-hidden="true" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                aria-label="Quantity"
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="h-10 w-14 border-0 px-1 text-center shadow-none focus-visible:ring-0"
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>
                <Plus aria-hidden="true" />
              </Button>
            </div>
            <Button type="button" className="flex-1" size="lg" onClick={() => void handleAddToBag()} disabled={!canPurchase || isLoading}>
              <ShoppingBag aria-hidden="true" /> {isLoading ? "Adding…" : "Add to bag"}
            </Button>
          </div>
          <Button type="button" variant="outline" className="mt-3 w-full" size="lg" onClick={() => void handleBuyNow()} disabled={!canPurchase || isLoading}>
            Buy now
          </Button>
          {cartError && <p className="mt-3 text-sm text-destructive" role="alert">{cartError}</p>}
          <p className="mt-4 text-xs text-muted-foreground">Shipping, delivery and payment options are confirmed at secure checkout.</p>

          <Accordion type="single" collapsible className="mt-8 border-t border-border">
            <AccordionItem value="description">
              <AccordionTrigger>Product description</AccordionTrigger>
              <AccordionContent><p className="whitespace-pre-line">{product.description || "Details for this piece will be added soon."}</p></AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Material & care</AccordionTrigger>
              <AccordionContent>
                <p>{product.tags.length ? product.tags.join(" · ") : "Material details are listed by the store for each piece."}</p>
                <p className="mt-2">Store in a soft pouch and keep away from water, perfume and direct moisture.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping & returns</AccordionTrigger>
              <AccordionContent>
                <p>Delivery options and charges are shown at Shopify checkout. Returns and exchanges follow the store policies.</p>
                <Link to="/policies" className="mt-2 inline-flex text-primary underline underline-offset-4">Read store policies</Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-border pt-12 sm:mt-20">
          <p className="eyebrow">More to love</p>
          <h2 className="section-title mt-2">Complete the look</h2>
          <div className="product-grid mt-8">
            {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </main>
  );
}