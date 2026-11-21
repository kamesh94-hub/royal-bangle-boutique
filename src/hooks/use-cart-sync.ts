import { useEffect } from "react";

import { useCartStore } from "@/stores/cart";

export function useCartSync() {
  const syncCart = useCartStore((state) => state.syncCart);

  useEffect(() => {
    let isMounted = true;

    const restoreAndSync = async () => {
      await useCartStore.persist?.rehydrate();
      if (isMounted) await syncCart();
    };

    void restoreAndSync();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void syncCart();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncCart]);
}