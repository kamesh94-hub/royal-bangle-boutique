import { useCallback, useEffect, useState } from "react";

const WISHLIST_STORAGE_KEY = "ishwariyam-wishlist";

export function useWishlist() {
  const [productIds, setProductIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setProductIds(parsed);
        }
      }
    } catch {
      setProductIds([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
    } catch {
      // Wishlist remains available for the current page when browser storage is blocked.
    }
  }, [isReady, productIds]);

  const toggleProduct = useCallback((productId: string) => {
    setProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  return {
    productIds,
    isReady,
    isSaved: (productId: string) => productIds.includes(productId),
    toggleProduct,
  };
}