import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Instagram, MessageCircle, Sparkles } from "lucide-react";

const whatsappContacts = [
  { name: "ISHWARIYA", number: "919894426360" },
  { name: "GAYATHRI", number: "918667073650" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.35fr_1fr_1fr_1.2fr] lg:px-12">
        <div className="space-y-4">
          <Link to="/" className="brand-lockup" aria-label="ISHWARIYAM FANCY BANGLES home">
            <span className="brand-seal" aria-hidden="true"><Sparkles /></span>
            <span className="brand-wordmark">
              <span className="brand-name">ISHWARIYAM</span>
              <span className="brand-subtitle">FANCY BANGLES</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            A celebration of Indian artistry, colour and the everyday ritual of getting ready.
          </p>
        </div>

        <div>
          <h2 className="footer-heading">Explore</h2>
          <ul className="footer-list">
            <li><Link to="/shop">Shop all bangles</Link></li>
            <li><Link to="/shop" search={{ category: "Bridal" }}>Bridal sets</Link></li>
            <li><Link to="/shop" search={{ category: "Silk Thread" }}>Silk thread</Link></li>
            <li><Link to="/" hash="size-guide">Find your size</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="footer-heading">Customer care</h2>
          <ul className="footer-list">
            <li><Link to="/policies">Shipping & returns</Link></li>
            <li><Link to="/policies">Care information</Link></li>
            {whatsappContacts.map((contact) => (
              <li key={contact.number}>
                <a
                  href={`https://wa.me/${contact.number}?text=${encodeURIComponent("Hello ISHWARIYAM FANCY BANGLES, I need help with an order.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp {contact.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="newsletter-note">
          <h2 className="footer-heading">Notes from the atelier</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            For new arrivals and special pieces, find our latest updates on Instagram.
          </p>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Instagram aria-hidden="true" className="size-4" /> Instagram <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>© {new Date().getFullYear()} ISHWARIYAM FANCY BANGLES</span>
          <span>Secure checkout powered by Shopify</span>
        </div>
      </div>
    </footer>
  );
}