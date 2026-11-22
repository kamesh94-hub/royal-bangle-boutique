import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, Sparkles, UserRound } from "lucide-react";

import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useWishlist } from "@/hooks/use-wishlist";

const categoryLinks = [
  { label: "Bridal sets", category: "Bridal" },
  { label: "Silk thread", category: "Silk Thread" },
  { label: "Glass bangles", category: "Glass" },
  { label: "Gold plated", category: "Gold" },
  { label: "Daily wear", category: "Daily Wear" },
];

export function SiteHeader() {
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const { productIds } = useWishlist();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void navigate({
      to: "/shop",
      search: { q: searchValue.trim() || undefined },
    });
  };

  const categoryNav = categoryLinks.map((item) => (
    <Link
      key={item.category}
      to="/shop"
      search={{ category: item.category }}
      className="nav-link"
    >
      {item.label}
    </Link>
  ));

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="announcement-bar">
        <span>Shipping across India</span>
        <span aria-hidden="true">·</span>
        <span>Cash on delivery options at checkout</span>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open categories">
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(85vw,22rem)]">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">Explore</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4">
              {categoryNav}
              <Link to="/shop" className="nav-link">All bangles</Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="brand-lockup" aria-label="ISHWARIYAM FANCY BANGLES home">
          <span className="brand-seal" aria-hidden="true"><Sparkles /></span>
          <span className="brand-wordmark">
            <span className="brand-name">ISHWARIYAM</span>
            <span className="brand-subtitle">FANCY BANGLES</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Collections">
          {categoryNav}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <form onSubmit={handleSearch} className="hidden w-48 items-center gap-2 border-b border-border lg:flex">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              aria-label="Search bangles"
              placeholder="Search bangles"
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </form>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Wishlist, ${productIds.length} saved items`}>
            <Link to="/wishlist">
              <Heart aria-hidden="true" />
              {productIds.length > 0 && <span className="count-dot">{productIds.length}</span>}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Store administration">
            <Link to="/admin"><UserRound aria-hidden="true" /></Link>
          </Button>
          <CartDrawer />
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex items-center gap-2 border-t border-border/70 px-4 py-2 lg:hidden">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          aria-label="Search bangles"
          placeholder="Search the collection"
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </form>
    </header>
  );
}