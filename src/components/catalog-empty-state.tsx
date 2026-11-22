import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHOPIFY_ADMIN_URL } from "@/lib/shopify-storefront";

interface CatalogEmptyStateProps {
  compact?: boolean;
}

export function CatalogEmptyState({ compact = false }: CatalogEmptyStateProps) {
  return (
    <div className={`catalog-empty-state ${compact ? "catalog-empty-state-compact" : ""}`}>
      <Sparkles aria-hidden="true" className="mx-auto size-7 text-accent" />
      <h3 className="mt-4 font-display text-2xl">No products found</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        Add your first bangle collection in Shopify and it will appear here.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <a href={`${SHOPIFY_ADMIN_URL}/products/new`} target="_blank" rel="noreferrer">
            Add a product <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
        {!compact && (
          <Button asChild variant="outline">
            <Link to="/shop">Browse the collection</Link>
          </Button>
        )}
      </div>
    </div>
  );
}