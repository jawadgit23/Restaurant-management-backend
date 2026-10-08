import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CornerLeftDown, CornerRightDown, Beef, CupSoda, Flame } from "lucide-react";
import Marquee from "./Marquee";

const TICKER_TAGS = [
  "Whole Roasted Sajji",
  "Live BBQ Grill",
  "Halal Certified",
  "Free Delivery Over Rs 2000",
  "2 Karachi Branches",
  "Fresh Off The Coals",
];

const CATEGORY_STRIP = [
  "Sajji & Mandi",
  "Live BBQ",
  "Smash Burgers",
  "Karahi",
  "Rolls & Sandwiches",
  "Shakes & Beverages",
  "Roti & Naan",
];

// Big poster-style promo slides — full-bleed food photo, bold slogan, and
// floating price tags, in the spirit of a fast-food brand's promo banner.
const SLIDES = [
  {
    key: "sajji",
    icon: Flame,
    gradient: "linear-gradient(110deg, #2A0705 0%, #7A2A0F 55%, #B8451A 100%)",
    tagBg: "#1FA34A", // green
    eyebrow: "NOW SERVING",
    title: ["SMOKY", "SAJJI"],
    tagline: "STRAIGHT OFF THE COALS!",
    tags: [
      { label: "Whole Sajji", price: "Rs 1800", pos: "right-[8%] top-[16%] rotate-[-6deg]", arrow: "left" },
      { label: "Chicken Mandi", price: "Rs 1600", pos: "right-[14%] bottom-[22%] rotate-[4deg]", arrow: "left" },
    ],
  },
  {
    key: "burgers",
    icon: Beef,
    gradient: "linear-gradient(110deg, #3A0F05 0%, #A83A10 55%, #E8491D 100%)",
    tagBg: "#F5A623", // yellow
    eyebrow: "FRESH OFF THE GRILL",
    title: ["STACKED &", "SMASHED"],
    tagline: "DOUBLE THE PATTY. DOUBLE THE FLAVOUR.",
    tags: [
      { label: "Classic Smash", price: "Rs 650", pos: "right-[10%] top-[18%] rotate-[5deg]", arrow: "left" },
      { label: "Double Smash", price: "Rs 950", pos: "right-[16%] bottom-[20%] rotate-[-5deg]", arrow: "left" },
    ],
  },
  {
    key: "bbq",
    icon: Flame,
    gradient: "linear-gradient(110deg, #140D0A 0%, #5A3210 55%, #8A4A15 100%)",
    tagBg: "#E8491D",
    eyebrow: "LIVE BBQ GRILL",
    title: ["CHARCOAL", "FIRE"],
    tagline: "MARINATED OVERNIGHT. GRILLED TO ORDER.",
    tags: [
      { label: "Mixed Grill Platter", price: "Rs 1800", pos: "right-[8%] top-[16%] rotate-[-4deg]", arrow: "left" },
      { label: "Beef Chapli Kebab", price: "Rs 700", pos: "right-[16%] bottom-[24%] rotate-[6deg]", arrow: "left" },
    ],
  },
  {
    key: "shakes",
    icon: CupSoda,
    gradient: "linear-gradient(110deg, #0A3617 0%, #146830 55%, #1FA34A 100%)",
    tagBg: "#DC2626", // red
    eyebrow: "COOL DOWN",
    title: ["THICK &", "CREAMY"],
    tagline: "HAND-BLENDED. SERVED ICE COLD.",
    tags: [
      { label: "Oreo Cookie Shake", price: "Rs 520", pos: "right-[10%] top-[18%] rotate-[5deg]", arrow: "left" },
      { label: "Mango Lassi", price: "Rs 350", pos: "right-[18%] bottom-[22%] rotate-[-6deg]", arrow: "left" },
    ],
  },
];

const SLIDE_DURATION = 7000; // generous window so slower connections finish loading the photo before it auto-advances

function PriceTag({ tag }) {
  const Arrow = tag.arrow === "left" ? CornerLeftDown : CornerRightDown;
  return (
    <div className={`absolute ${tag.pos} hidden flex-col items-center sm:flex`}>
      <Arrow size={22} className="mb-1 text-white/80 drop-shadow" />
      <div
        className="rounded-xl px-3.5 py-2 text-center shadow-lg"
        style={{ backgroundColor: tag.tagBgOverride, transform: "rotate(0deg)" }}
      >
        <p className="text-[10px] font-bold uppercase leading-none tracking-wide text-black/70">{tag.label}</p>
        <p className="mt-1 font-[Anton] text-base leading-none tracking-wide text-black">{tag.price}</p>
      </div>
    </div>
  );
}

function Hero() {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (i) => setActive((i + SLIDES.length) % SLIDES.length);
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const slide = SLIDES[active];

  return (
    <section id="home" className="relative bg-white pb-0 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div
          className="group relative h-[78vh] min-h-[540px] max-h-[760px] w-full overflow-hidden rounded-2xl shadow-2xl sm:rounded-[28px]"
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={() => {
            timerRef.current = setTimeout(next, SLIDE_DURATION);
          }}
        >
          {/* Color-tinted poster background, unique per slide — pure CSS/SVG,
              nothing fetched over the network, so it can never fail to load
              or flicker in and out like a hotlinked photo would. */}
          <div
            className="absolute inset-0 transition-[background] duration-700"
            style={{ backgroundImage: slide.gradient }}
          />

          {/* Big translucent icon + rising embers for texture */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {SLIDES.map((s, i) => {
              const Icon = s.icon;
              return (
                <Icon
                  key={s.key}
                  className={`absolute -right-10 top-1/2 h-[85%] w-auto -translate-y-1/2 text-white transition-opacity duration-[1200ms] ease-in-out sm:right-0 ${
                    i === active ? "opacity-[0.10]" : "opacity-0"
                  }`}
                  strokeWidth={1}
                />
              );
            })}
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="animate-ember absolute bottom-16 h-1.5 w-1.5 rounded-full bg-white/70"
                style={{
                  left: `${55 + i * 5}%`,
                  animationDelay: `${i * 0.5}s`,
                  "--drift": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 2)}px`,
                }}
              />
            ))}
          </div>

          {/* Price tag call-outs */}
          {slide.tags.map((tag, i) => (
            <PriceTag key={`${slide.key}-${i}`} tag={{ ...tag, tagBgOverride: slide.tagBg }} />
          ))}

          {/* Content */}
          <div className="relative flex h-full flex-col justify-end px-6 pb-8 sm:px-12 sm:pb-14">
            <div key={`eyebrow-${active}`} className="animate-fade-in">
              <span
                className="inline-block -rotate-2 rounded-md px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest text-black shadow-md"
                style={{ backgroundColor: slide.tagBg }}
              >
                {slide.eyebrow}
              </span>
            </div>

            <h1
              key={`title-${active}`}
              className="mt-4 animate-fade-in font-[Anton] text-6xl leading-[0.88] tracking-wide text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.5)] sm:text-8xl lg:text-9xl"
            >
              {slide.title.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p
              key={`tagline-${active}`}
              className="mt-4 max-w-lg animate-fade-in text-sm font-bold uppercase tracking-widest text-white/85 sm:text-base"
            >
              {slide.tagline}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                onClick={() => scrollTo("#menu")}
                className="btn-shine rounded-md bg-[#E8491D] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#c93c14]"
              >
                Order Now
              </button>
              <button
                onClick={() => scrollTo("#locations")}
                className="rounded-md border border-white/40 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                Find a Branch
              </button>
            </div>
          </div>

          {/* Prev / next arrows, overlapping the rounded edges like a promo card */}
          <button
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1C1410] opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100 sm:left-5"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next slide"
            onClick={next}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1C1410] opacity-0 shadow-lg transition hover:bg-white group-hover:opacity-100 sm:right-5"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 sm:left-12 sm:translate-x-0">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Category quick-nav strip, tucked under the slider like a promo site's menu tabs */}
        <div className="scrollbar-none -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:justify-center sm:px-0">
          {CATEGORY_STRIP.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollTo("#menu")}
              className="shrink-0 rounded-full border border-[#E8491D]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#1C1410] shadow-sm transition hover:border-[#E8491D] hover:text-[#E8491D]"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Orange-on-white ticker strip bridging the hero into the cream menu */}
      <div className="relative mt-8 border-t border-white/10 bg-[#E8491D] py-3">
        <Marquee
          items={TICKER_TAGS}
          itemClassName="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white after:ml-8 after:content-['•'] after:text-white/50"
        />
      </div>
    </section>
  );
}

export default Hero;
