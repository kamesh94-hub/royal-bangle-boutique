import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSizeOptionName } from "@/lib/bangle-sizes";
import { formatINR, type ShopifyProduct, type ShopifyVariant } from "@/lib/shopify-storefront";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCartStore } from "@/stores/cart";

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isSaved, toggleProduct } = useWishlist();
  const saved = isSaved(product.id);
  const sizeOptionName = getSizeOptionName(product.options);
  const sizeValues = sizeOptionName
    ? (product.options.find((option) => option.name === sizeOptionName)?.values ?? [])
    : [];
  const [selectedSize, setSelectedSize] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);
  const cartError = useCartStore((state) => state.error);

  const selectedVariant: ShopifyVariant | undefined = sizeOptionName
    ? product.variants.find((variant) =>
        variant.selectedOptions.some(
          (option) => option.name === sizeOptionName && option.value === selectedSize,
        ),
      )
    : undefined;

  const handleQuickAdd = async () => {
    if (!selectedVariant?.availableForSale) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions,
    });
    if (!useCartStore.getState().error) setIsQuickAddOpen(false);
  };

  const firstVariant = product.variants.find((variant) => variant.availableForSale);
  const discountPercent = firstVariant?.compareAtPrice
    ? Math.round(
        (1 - Number(firstVariant.price.amount) / Number(firstVariant.compareAtPrice.amount)) * 100,
      )
    : 0;

  return (
    <article className="product-card group">
      <div className="relative overflow-hidden bg-muted">
        <Link
          to="/product/$handle"
          params={{ handle: product.handle }}
          aria-label={`View ${product.title}`}
          className="block aspect-[4/5] overflow-hidden"
        >
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.title}
              className="product-card-image h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Product image coming soon
            </div>
          )}
        </Link>
        {discountPercent > 0 && (
          <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            {discountPercent}% off
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3"
          aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
          aria-pressed={saved}
          onClick={() => toggleProduct(product.id)}
        >
          <Heart aria-hidden="true" className={saved ? "fill-primary text-primary" : ""} />
        </Button>
      </div>

      <div className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/product/$handle"
              params={{ handle: product.handle }}
              className="font-display text-lg leading-snug text-foreground hover:text-primary"
            >
              {product.title}
            </Link>
            <p className="mt-1 text-xs uppercase text-muted-foreground">{product.productType || "Bangle set"}</p>
          </div>
          {firstVariant && (
            <div className="shrink-0 text-right">
              <p className="font-semibold">{formatINR(firstVariant.price.amount, firstVariant.price.currencyCode)}</p>
              {firstVariant.compareAtPrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatINR(firstVariant.compareAtPrice.amount, firstVariant.compareAtPrice.currencyCode)}
                </p>
              )}
            </div>
          )}
        </div>
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsQuickAddOpen(true)}
            disabled={!firstVariant}
          >
            <ShoppingBag aria-hidden="true" /> Quick add
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Choose your size</DialogTitle>
              <DialogDescription>{product.title}</DialogDescription>
            </DialogHeader>
            {sizeValues.length > 0 ? (
              <div className="flex flex-wrap gap-2" aria-label="Available bangle sizes">
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
              <p className="text-sm text-muted-foreground">
                Size options have not been added to this product yet.
              </p>
            )}
            {cartError && <p className="text-sm text-destructive" role="alert">{cartError}</p>}
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleQuickAdd()}
              disabled={!selectedVariant?.availableForSale || isLoading}
            >
              {isLoading ? "Adding…" : "Add to bag"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}