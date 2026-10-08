import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { Flame } from "lucide-react";
import { foodItems as mockFoodItems, foodCategories as mockFoodCategories } from "../../data/mockData";
import { listFoodItems } from "../../lib/api/foodItems";
import { useApiData } from "../../hooks/useApiData";
import MenuItemCard from "./MenuItemCard";
import Reveal from "./Reveal";
import { useRestaurant } from "../context/RestaurantContext";
import { isBackendConfigured } from "../../lib/apiClient";

const SMASH_CATEGORIES = ["Burgers", "Chicken", "Pizza", "Sandwiches", "Rolls", "Sides", "Shakes", "Beverages", "Desserts"];
const DESI_CATEGORIES = ["BBQ", "Sajji", "Mandi", "Chargha", "Karahi", "Roti & Naan"];

function MenuSection() {
  const [active, setActive] = useState("All");
  const railRef = useRef(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  // Live menu items from the dashboard/Supabase, falling back to mock data
  // when Supabase isn't configured yet. Previously this section imported
  // `foodItems` straight from mockData, so anything added in the dashboard
  // never showed up here.
  const { restaurants, restaurant, restaurantId, selectRestaurant } = useRestaurant();
  const { data: allItems } = useApiData(
    () => (isBackendConfigured && !restaurantId ? Promise.resolve([]) : listFoodItems(restaurantId)),
    mockFoodItems,
    [restaurantId]
  );
  const foodItems = useMemo(() => allItems.filter((i) => i.available !== false), [allItems]);

  const foodCategories = useMemo(() => {
    const fromItems = Array.from(new Set(foodItems.map((i) => i.category))).filter(Boolean);
    return fromItems.length ? fromItems : mockFoodCategories;
  }, [foodItems]);

  const filtered = useMemo(() => {
    if (active === "All") return null;
    return foodItems.filter((i) => i.category === active);
  }, [active, foodItems]);

  const smashItems = foodItems.filter((i) => SMASH_CATEGORIES.includes(i.category));
  const desiItems = foodItems.filter((i) => DESI_CATEGORIES.includes(i.category));
  const otherItems = foodItems.filter(
    (i) => !SMASH_CATEGORIES.includes(i.category) && !DESI_CATEGORIES.includes(i.category)
  );

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const activeBtn = rail.querySelector(`[data-cat="${active}"]`);
    if (activeBtn) {
      setPill({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
    }
  }, [active]);

  return (
    <section id="menu" className="bg-[#FFFFFF]">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-8 sm:pt-28">
        <Reveal>
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-[#E8491D]">
            <Flame size={14} className="animate-glow-pulse" /> The Full Menu
          </p>
          <h2 className="mt-2 font-[Anton] text-4xl tracking-wide text-[#1C1410] sm:text-5xl">
            THE FULL SPREAD.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-black/55 sm:text-base">
            Whole-roasted sajji, smoky BBQ, and desi karahi on one side, cheesy burgers, rolls
            and shawarma on the other. Order anything, from anywhere on the menu.
          </p>
        </Reveal>

        {/* Branch switcher – the menu, cart and checkout all belong to one branch at a time */}
        {restaurants.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-black/45">Ordering from</span>
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => selectRestaurant(r.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  restaurant?.id === r.id
                    ? "border-[#E8491D] bg-[#E8491D]/10 text-[#E8491D]"
                    : "border-black/15 text-black/60 hover:bg-black/5"
                }`}
              >
                {r.name.replace(/^Areeba\s+/i, "")}
              </button>
            ))}
          </div>
        )}

        {/* Category filter with a sliding orange pill indicator */}
        <div
          ref={railRef}
          className="relative mt-8 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <span
            className="absolute top-0 h-[38px] rounded-full bg-[#E8491D] transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width }}
          />
          <button
            data-cat="All"
            onClick={() => setActive("All")}
            className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
              active === "All" ? "text-white" : "text-black/60 hover:text-black"
            }`}
          >
            All Items
          </button>
          {foodCategories.map((cat) => (
            <button
              key={cat}
              data-cat={cat}
              onClick={() => setActive(cat)}
              className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${
                active === cat ? "text-white" : "text-black/60 hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered ? (
        // Single filtered grid
        <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => (
              <Reveal key={item.id} index={i}>
                <MenuItemCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* The Fast Table */}
          <div className="bg-white px-5 pb-16 pt-10 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <Reveal>
                <h3 className="font-[Anton] text-2xl tracking-wide text-[#1C1410] sm:text-3xl">
                  THE FAST TABLE
                </h3>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {smashItems.map((item, i) => (
                  <Reveal key={item.id} index={i % 8}>
                    <MenuItemCard item={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* Section divider accent */}
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E8491D]/25 to-transparent" />
          </div>

          {/* The Desi Table */}
          <div className="bg-white px-5 pb-24 pt-16 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <Reveal>
                <h3 className="font-[Anton] text-2xl tracking-wide text-[#1C1410] sm:text-3xl">
                  THE DESI TABLE
                </h3>
                <p className="mt-2 max-w-lg text-sm text-black/55">
                  Fresh off the tandoor and the charcoal grill — Karachi's classics, done right.
                </p>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {desiItems.map((item, i) => (
                  <Reveal key={item.id} index={i % 8}>
                    <MenuItemCard item={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* Anything added with a category outside the two curated tables above */}
          {otherItems.length > 0 && (
            <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
              <Reveal>
                <h3 className="font-[Anton] text-2xl tracking-wide text-[#1C1410] sm:text-3xl">
                  MORE FROM THE MENU
                </h3>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherItems.map((item, i) => (
                  <Reveal key={item.id} index={i % 8}>
                    <MenuItemCard item={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default MenuSection;
