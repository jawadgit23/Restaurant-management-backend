import { useState } from "react";
import { Flame, Plus, Star, TrendingUp } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { formatPKR } from "../../data/mockData";

const SPICY_HINTS = ["spicy", "chipotle", "peri peri", "jalape", "fiery"];

function MenuItemCard({ item }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [burstKey, setBurstKey] = useState(0);
  const [pressed, setPressed] = useState(false);

  const isBestseller = item.orders >= 300;
  const isSpicy = SPICY_HINTS.some(
    (hint) => item.name.toLowerCase().includes(hint) || (item.description || "").toLowerCase().includes(hint)
  );

  const handleAdd = () => {
    if (!item.available) return;
    addItem(item, 1);
    toast(`Added to cart`, { description: item.name, duration: 2000 });
    setBurstKey((k) => k + 1);
    setPressed(true);
    setTimeout(() => setPressed(false), 220);
  };

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 sm:gap-4 sm:p-4">
      {/* Left: text content */}
      <div className="min-w-0 flex-1">
        {(isBestseller || isSpicy) && (
          <div className="mb-1 flex items-center gap-2.5">
            {isBestseller && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#F5A623]">
                <TrendingUp size={11} /> Bestseller
              </span>
            )}
            {isSpicy && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#DC2626]">
                <Flame size={11} /> Spicy
              </span>
            )}
          </div>
        )}

        <h3 className="text-sm font-bold leading-snug text-[#1C1410] sm:text-base">{item.name}</h3>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-black/45">{item.description}</p>
        )}

        <div className="mt-2.5 flex items-center gap-3">
          {item.available ? (
            <span className="text-base font-extrabold text-[#E8491D] sm:text-lg">{formatPKR(item.price)}</span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-black/35">Sold Out</span>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-black/40">
            <Star size={12} className="fill-[#F5A623] text-[#F5A623]" /> {item.rating}
          </span>
        </div>
      </div>

      {/* Right: photo with a floating black add button, no boxy overlay clutter */}
      <div className="relative shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-black/5 sm:h-28 sm:w-28">
          <img
            src={item.photo}
            alt={item.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110 ${
              !item.available ? "opacity-40 grayscale" : ""
            }`}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!item.available}
          className={`absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1410] text-white shadow-md transition hover:scale-110 hover:bg-black disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 ${
            pressed ? "scale-90" : "scale-100"
          }`}
        >
          <Plus size={17} strokeWidth={3} />
          {burstKey > 0 && (
            <span
              key={burstKey}
              className="animate-fly-to-cart pointer-events-none absolute -top-1 right-0 rounded-full bg-[#E8491D] px-1.5 py-0.5 text-[10px] font-extrabold text-white"
              style={{ "--fly-x": "30px", "--fly-y": "-70px" }}
            >
              +1
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default MenuItemCard;
