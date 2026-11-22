import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  toggleProduct: (productId: string) => void;
}

const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      productIds: [],
      toggleProduct: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
    }),
    {
      name: "ishwariyam-wishlist",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? undefined : window.localStorage,
      ),
      skipHydration: true,
    },
  ),
);

export function useWishlistSync() {
  useEffect(() => {
    void useWishlistStore.persist?.rehydrate();
  }, []);
}

export function useWishlist() {
  const productIds = useWishlistStore((state) => state.productIds);
  const toggleProduct = useWishlistStore((state) => state.toggleProduct);

  return {
    productIds,
    isSaved: (productId: string) => productIds.includes(productId),
    toggleProduct,
  };
}