import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPKR } from "../../data/mockData";
import CheckoutModal from "./CheckoutModal";

function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQty, removeItem, subtotal, totalItems } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Reset the enter transition whenever the drawer newly opens. This is the
  // documented "adjusting state during render" pattern for resetting state
  // on a prop change, so it doesn't cause an extra cascading render.
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) setEntered(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setEntered(true));
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const deliveryFee = subtotal > 0 ? 150 : 0;
  const total = subtotal + deliveryFee;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-[#FFFFFF] shadow-2xl transition-transform duration-350 ease-out ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center justify-between border-b border-black/10 bg-[#E8491D] px-6 py-5">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag size={19} className={totalItems > 0 ? "animate-float-y" : ""} />
            <h2 className="font-[Anton] text-lg tracking-wide">YOUR ORDER</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-md p-1.5 text-white/70 transition hover:rotate-90 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <ShoppingBag size={26} className="text-black/30" />
            </div>
            <p className="mt-4 text-sm font-semibold text-black/60">Your cart is empty</p>
            <p className="mt-1 text-xs text-black/40">Add something delicious from the menu.</p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 rounded-md bg-[#E8491D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c93c14]"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="animate-fade-in flex gap-3 rounded-lg border border-black/5 bg-white p-3 transition hover:border-[#E8491D]/30 hover:shadow-md"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <img src={item.photo} alt={item.name} className="h-16 w-16 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold leading-snug text-[#1C1410]">{item.name}</h4>
                        <button onClick={() => removeItem(item.id)} className="shrink-0 text-black/30 transition hover:scale-110 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-black/45">{formatPKR(item.price)} each</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-black/10">
                          <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1.5 text-black/60 hover:text-black">
                            <Minus size={12} />
                          </button>
                          <span key={item.qty} className="w-5 animate-pop-in text-center text-xs font-bold text-[#1C1410]">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1.5 text-black/60 hover:text-black">
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-extrabold text-[#1C1410]">{formatPKR(item.qty * item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-black/10 bg-white px-6 py-5">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-black/60">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-[#1C1410]">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-[#1C1410]">{formatPKR(deliveryFee)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-dashed border-black/15 pt-2 text-base">
                  <span className="font-bold text-[#1C1410]">Total</span>
                  <span key={total} className="animate-pop-in font-extrabold text-[#E8491D]">{formatPKR(total)}</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutOpen(true)}
                className="btn-shine mt-4 w-full rounded-md bg-[#E8491D] py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#E8491D]/25 transition hover:bg-[#c93c14]"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} subtotal={subtotal} total={total} deliveryFee={deliveryFee} />
    </div>,
    document.body
  );
}

export default CartDrawer;
