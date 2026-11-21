import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  formatShopifyCheckoutUrl,
  storefrontApiRequest,
  type ShopifyMoney,
  type ShopifyProduct,
  type ShopifySelectedOption,
} from "@/lib/shopify-storefront";

export interface CartItem {
  lineId: string;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: ShopifyMoney;
  quantity: number;
  selectedOptions: ShopifySelectedOption[];
}

export type NewCartItem = Omit<CartItem, "lineId">;

interface ShopifyUserError {
  field: string[] | null;
  message: string;
}

interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: { id: string };
}

interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: { edges: Array<{ node: ShopifyCartLine }> };
  discountCodes?: Array<{ code: string; applicable: boolean }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  discountMessage: string | null;
  addItem: (item: NewCartItem) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

const CART_CREATE_MUTATION = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        lines(first: 100) {
          edges { node { id quantity merchandise { ... on ProductVariant { id } } } }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation AddCartLine($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        lines(first: 100) {
          edges { node { id quantity merchandise { ... on ProductVariant { id } } } }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

const CART_DISCOUNT_MUTATION = `
  mutation UpdateCartDiscounts($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { id checkoutUrl discountCodes { code applicable } }
      userErrors { field message }
    }
  }
`;

const CART_QUERY = `
  query GetCart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      lines(first: 100) {
        edges { node { id quantity merchandise { ... on ProductVariant { id } } } }
      }
    }
  }
`;

function userErrorMessage(errors: ShopifyUserError[]): string | null {
  if (errors.length === 0) return null;
  return errors.map((error) => error.message).join(" ");
}

function isExpiredCart(errors: ShopifyUserError[]): boolean {
  return errors.some((error) => /cart not found|does not exist/i.test(error.message));
}

function getCartLine(cart: ShopifyCart, variantId: string): ShopifyCartLine | undefined {
  return cart.lines.edges.find((edge) => edge.node.merchandise.id === variantId)?.node;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,
      error: null,
      discountMessage: null,

      addItem: async (item) => {
        if (!useCartStore.persist?.hasHydrated()) await useCartStore.persist?.rehydrate();

        const { cartId, items } = get();
        const existingItem = items.find((current) => current.variantId === item.variantId);
        set({ isLoading: true, error: null });

        try {
          if (!cartId) {
            const data = await storefrontApiRequest<{
              cartCreate: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] };
            }>(CART_CREATE_MUTATION, {
              input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
            });
            const message = userErrorMessage(data.cartCreate.userErrors);
            if (message) throw new Error(message);

            const cart = data.cartCreate.cart;
            const line = cart ? getCartLine(cart, item.variantId) : undefined;
            if (!cart || !line) throw new Error("The store could not create this cart item.");

            set({
              cartId: cart.id,
              checkoutUrl: formatShopifyCheckoutUrl(cart.checkoutUrl),
              items: [{ ...item, lineId: line.id, quantity: line.quantity }],
            });
            return;
          }

          if (existingItem) {
            const nextQuantity = existingItem.quantity + item.quantity;
            const data = await storefrontApiRequest<{
              cartLinesUpdate: {
                cart: Pick<ShopifyCart, "id" | "checkoutUrl" | "totalQuantity"> | null;
                userErrors: ShopifyUserError[];
              };
            }>(CART_LINES_UPDATE_MUTATION, {
              cartId,
              lines: [{ id: existingItem.lineId, quantity: nextQuantity }],
            });
            const errors = data.cartLinesUpdate.userErrors;
            if (isExpiredCart(errors)) {
              get().clearCart();
              return;
            }
            const message = userErrorMessage(errors);
            if (message) throw new Error(message);

            set({
              items: get().items.map((current) =>
                current.variantId === item.variantId
                  ? { ...current, quantity: nextQuantity }
                  : current,
              ),
              checkoutUrl: data.cartLinesUpdate.cart
                ? formatShopifyCheckoutUrl(data.cartLinesUpdate.cart.checkoutUrl)
                : get().checkoutUrl,
            });
            return;
          }

          const data = await storefrontApiRequest<{
            cartLinesAdd: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] };
          }>(CART_LINES_ADD_MUTATION, {
            cartId,
            lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
          });
          const errors = data.cartLinesAdd.userErrors;
          if (isExpiredCart(errors)) {
            get().clearCart();
            return;
          }
          const message = userErrorMessage(errors);
          if (message) throw new Error(message);

          const cart = data.cartLinesAdd.cart;
          const line = cart ? getCartLine(cart, item.variantId) : undefined;
          if (!cart || !line) throw new Error("The store could not add this item to your cart.");

          set({
            items: [...get().items, { ...item, lineId: line.id, quantity: line.quantity }],
            checkoutUrl: formatShopifyCheckoutUrl(cart.checkoutUrl),
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not update your cart." });
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }

        const { cartId, items } = get();
        const item = items.find((current) => current.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true, error: null });
        try {
          const data = await storefrontApiRequest<{
            cartLinesUpdate: {
              cart: Pick<ShopifyCart, "id" | "checkoutUrl" | "totalQuantity"> | null;
              userErrors: ShopifyUserError[];
            };
          }>(CART_LINES_UPDATE_MUTATION, {
            cartId,
            lines: [{ id: item.lineId, quantity }],
          });
          const errors = data.cartLinesUpdate.userErrors;
          if (isExpiredCart(errors)) {
            get().clearCart();
            return;
          }
          const message = userErrorMessage(errors);
          if (message) throw new Error(message);

          set({
            items: get().items.map((current) =>
              current.variantId === variantId ? { ...current, quantity } : current,
            ),
            checkoutUrl: data.cartLinesUpdate.cart
              ? formatShopifyCheckoutUrl(data.cartLinesUpdate.cart.checkoutUrl)
              : get().checkoutUrl,
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not update quantity." });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { cartId, items } = get();
        const item = items.find((current) => current.variantId === variantId);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true, error: null });
        try {
          const data = await storefrontApiRequest<{
            cartLinesRemove: {
              cart: Pick<ShopifyCart, "id" | "checkoutUrl" | "totalQuantity"> | null;
              userErrors: ShopifyUserError[];
            };
          }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [item.lineId] });
          const errors = data.cartLinesRemove.userErrors;
          if (isExpiredCart(errors)) {
            get().clearCart();
            return;
          }
          const message = userErrorMessage(errors);
          if (message) throw new Error(message);

          const nextItems = get().items.filter((current) => current.variantId !== variantId);
          if (nextItems.length === 0) {
            get().clearCart();
          } else {
            set({
              items: nextItems,
              checkoutUrl: data.cartLinesRemove.cart
                ? formatShopifyCheckoutUrl(data.cartLinesRemove.cart.checkoutUrl)
                : get().checkoutUrl,
            });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not remove this item." });
        } finally {
          set({ isLoading: false });
        }
      },

      applyDiscountCode: async (code) => {
        const cartId = get().cartId;
        if (!cartId || !code.trim()) return;

        set({ isLoading: true, error: null, discountMessage: null });
        try {
          const data = await storefrontApiRequest<{
            cartDiscountCodesUpdate: {
              cart: {
                id: string;
                checkoutUrl: string;
                discountCodes: Array<{ code: string; applicable: boolean }>;
              } | null;
              userErrors: ShopifyUserError[];
            };
          }>(CART_DISCOUNT_MUTATION, { cartId, discountCodes: [code.trim()] });
          const message = userErrorMessage(data.cartDiscountCodesUpdate.userErrors);
          if (message) throw new Error(message);

          const cart = data.cartDiscountCodesUpdate.cart;
          const appliedCode = cart?.discountCodes.find(
            (discount) => discount.code.toLowerCase() === code.trim().toLowerCase(),
          );
          set({
            checkoutUrl: cart ? formatShopifyCheckoutUrl(cart.checkoutUrl) : get().checkoutUrl,
            discountMessage: appliedCode?.applicable
              ? `${appliedCode.code} applied.`
              : "That code is not available for this cart.",
          });
        } catch (error) {
          set({
            discountMessage:
              error instanceof Error ? error.message : "The code could not be checked.",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () =>
        set({
          items: [],
          cartId: null,
          checkoutUrl: null,
          discountMessage: null,
          error: null,
        }),

      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest<{ cart: ShopifyCart | null }>(CART_QUERY, {
            id: cartId,
          });
          const cart = data.cart;
          if (!cart || cart.totalQuantity === 0) {
            get().clearCart();
            return;
          }

          const lines = cart.lines.edges.map((edge) => edge.node);
          set({
            items: get()
              .items.map((item) => {
                const line = lines.find((current) => current.merchandise.id === item.variantId);
                return line
                  ? { ...item, lineId: line.id, quantity: line.quantity }
                  : null;
              })
              .filter((item): item is CartItem => item !== null),
            checkoutUrl: formatShopifyCheckoutUrl(cart.checkoutUrl),
          });
        } catch {
          // Preserve the saved cart when the storefront service is temporarily unavailable.
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "ishwariyam-shopify-cart",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? undefined : window.localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    },
  ),
);