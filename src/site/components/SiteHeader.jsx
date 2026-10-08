import { useEffect, useRef, useState } from "react";
import { Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import BrandLogo from "../../components/BrandLogo";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "Locations", href: "#locations" },
  { label: "Contact", href: "#contact" },
];

function SiteHeader() {
  const { totalItems, subtotal, setIsOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevTotal = useRef(totalItems);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 560);
      return () => clearTimeout(t);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow duration-300 ${
        scrolled ? "shadow-md shadow-black/5" : ""
      }`}
    >
      {/* Animated heat-line accent along the very top edge */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#E8491D] via-[#F5A623] to-[#E8491D] bg-[length:200%_100%] animate-gradient-shift" />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <button onClick={() => scrollTo("#home")} className="group flex items-center gap-2.5">
          <BrandLogo size={40} animated className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
          <span className="font-[Anton] text-xl tracking-wide text-[#1C1410]">
            AREEBA <span className="text-[#E8491D]">RESTAURANT</span>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="group relative text-sm font-semibold text-black/65 transition hover:text-[#1C1410]"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-[#E8491D] transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+923342795293"
            className="hidden items-center gap-2 text-sm font-semibold text-black/65 transition hover:text-[#1C1410] sm:flex"
          >
            <Phone size={15} /> +92 334 2795293
          </a>

          <button
            onClick={() => setIsOpen(true)}
            className={`btn-shine relative flex items-center gap-2 rounded-md bg-[#E8491D] px-3.5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E8491D]/30 transition hover:bg-[#c93c14] hover:shadow-lg hover:shadow-[#E8491D]/40 sm:px-4 ${
              bump ? "animate-cart-bump" : ""
            }`}
          >
            <ShoppingBag size={17} />
            <span className="hidden sm:inline">
              {totalItems > 0 ? `Rs ${subtotal.toLocaleString("en-PK")}` : "Cart"}
            </span>
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#E8491D] animate-pop-in">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-[#1C1410] md:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-black/10 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="rounded-md px-3 py-2.5 text-left text-sm font-semibold text-black/70 hover:bg-black/5"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
