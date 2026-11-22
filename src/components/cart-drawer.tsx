import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatINR } from "@/lib/shopify-storefront";
import { useCartStore } from "@/stores/cart";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const error = useCartStore((state) => state.error);
  const discountMessage = useCartStore((state) => state.discountMessage);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const applyDiscountCode = useCartStore((state) => state.applyDiscountCode);
  const syncCart = useCartStore((state) => state.syncCart);
  const checkoutUrl = useCartStore((state) => state.getCheckoutUrl());
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price.amount) * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (!checkoutUrl) return;
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleDiscount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void applyDiscountCode(discountCode);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (nextOpen) void syncCart();
      }}
    >
      <SheetTrigger asChild>
        <Button aria-label={`Open shopping bag, ${itemCount} items`} variant="ghost" size="icon" className="relative">
          <ShoppingBag aria-hidden="true" />
          {itemCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border pb-5">
          <SheetTitle className="font-display text-2xl">Your bag</SheetTitle>
          <SheetDescription>
            {itemCount === 0 ? "Your bag is waiting for something beautiful." : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Your bag is empty.</p>
            <Button asChild>
              <Link to="/shop">Explore the collection</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto py-5">
              {items.map((item) => (
                <article key={item.variantId} className="grid grid-cols-[5rem_1fr_auto] gap-3 border-b border-border pb-5">
                  {item.product.images[0] ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.images[0].altText ?? item.product.title}
                      className="aspect-square size-20 object-cover"
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium leading-snug">{item.product.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.selectedOptions.map((option) => option.value).join(" · ") || item.variantTitle}
                    </p>
                    <p className="mt-2 font-semibold">{formatINR(item.price.amount, item.price.currencyCode)}</p>
                    <div className="mt-3 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Decrease ${item.product.title} quantity`}
                        onClick={() => void updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Increase ${item.product.title} quantity`}
                        onClick={() => void updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.product.title}`}
                    onClick={() => void removeItem(item.variantId)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </article>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <form onSubmit={handleDiscount} className="flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                  aria-label="Discount code"
                  placeholder="Discount code"
                  autoComplete="off"
                />
                <Button type="submit" variant="outline" disabled={isLoading || !discountCode.trim()}>
                  Apply
                </Button>
              </form>
              {discountMessage && <p className="text-sm text-muted-foreground" role="status">{discountMessage}</p>}
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex items-center justify-between text-sm">
                <span>Items subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and payment options are calculated at checkout.</p>
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={!checkoutUrl || isLoading || isSyncing}
              >
                {isLoading || isSyncing ? "Updating bag…" : "Continue to secure checkout"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}