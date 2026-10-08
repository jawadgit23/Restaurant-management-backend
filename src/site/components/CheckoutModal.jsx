import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPKR } from "../../data/mockData";
import { placeOnlineOrder } from "../../lib/api/orders";
import { isBackendConfigured } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";

// name / phone stay null until the customer types, so the signed-in account's details are used as defaults
const emptyForm = { name: null, phone: null, address: "", payment: "Cash on Delivery" };
const emptyAuth = { name: "", email: "", password: "", phone: "" };

const inputCls =
  "w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#E8491D] focus:ring-2 focus:ring-[#E8491D]/10";

function generateOrderNumber() {
  return `BS-${Math.floor(10000 + Math.random() * 89999)}`;
}

function CheckoutModal({ open, onClose, total, deliveryFee }) {
  const { items, clearCart, setIsOpen } = useCart();
  const { user, isAuthenticated, isCustomer, signIn, signUp, signOut } = useAuth();
  const { restaurant } = useRestaurant();
  const [form, setForm] = useState(emptyForm);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [placedTotal, setPlacedTotal] = useState(null);
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const close = () => {
    onClose();
    if (placed) {
      setPlaced(false);
      setForm(emptyForm);
      setIsOpen(false);
    }
  };

  const name = (form.name ?? user?.name ?? "").trim();
  const phone = (form.phone ?? user?.phone ?? "").trim();

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    const result =
      authMode === "login"
        ? await signIn(authForm.email.trim(), authForm.password)
        : await signUp({ name: authForm.name.trim(), email: authForm.email.trim(), password: authForm.password, phone: authForm.phone.trim() });
    setAuthBusy(false);
    if (result.error) setAuthError(result.error.message || "Something went wrong. Please try again.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name) errs.name = "Required";
    if (!/^\+?[\d\s-]{7,}$/.test(phone)) errs.phone = "Enter a valid phone number";
    if (!form.address.trim()) errs.address = "Required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      let newOrderNumber = generateOrderNumber();
      let finalTotal = total;

      if (isBackendConfigured) {
        // Only item ids + quantities are sent. The server looks up prices and computes every total itself.
        const order = await placeOnlineOrder({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          name,
          phone,
          address: form.address.trim(),
          paymentMethod: form.payment,
        });
        newOrderNumber = order.orderNumber;
        finalTotal = order.total;
      }

      setPlacedTotal(finalTotal);
      setOrderNumber(newOrderNumber);
      setPlaced(true);
      clearCart();
    } catch (err) {
      setErrors({ submit: err.message || "Something went wrong placing your order. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      <div className="animate-modal-in relative w-full max-w-md overflow-hidden rounded-lg bg-[#FFFFFF] shadow-2xl">
        <div className="flex items-center justify-between bg-[#E8491D] px-6 py-4">
          <h3 className="font-[Anton] text-lg tracking-wide text-white">
            {placed ? "ORDER CONFIRMED" : "CHECKOUT"}
          </h3>
          <button onClick={close} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {placed ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/60" />
              <CheckCircle2 size={32} className="relative animate-pop-in text-emerald-600" />
            </div>
            <h4 className="mt-5 animate-fade-in text-lg font-bold text-[#1C1410]">Thanks, {name.split(" ")[0]}!</h4>
            <p className="mt-1 animate-fade-in text-sm text-black/55" style={{ animationDelay: "0.1s" }}>
              Your order <span className="font-bold text-[#1C1410]">{orderNumber}</span> has been sent to{" "}
              {restaurant?.name || "the restaurant"}.
              {placedTotal != null && <> Total: <span className="font-bold text-[#1C1410]">{formatPKR(placedTotal)}</span>.</>}
            </p>
            <p className="mt-3 animate-fade-in text-sm font-semibold text-black/70" style={{ animationDelay: "0.2s" }}>
              Estimated delivery: <span className="text-[#E8491D]">35–45 minutes</span>
            </p>
            <button
              onClick={close}
              className="btn-shine mt-7 w-full rounded-md bg-[#E8491D] py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#c93c14]"
            >
              Done
            </button>
          </div>
        ) : isBackendConfigured && !isCustomer ? (
          isAuthenticated ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-black/70">
                You're signed in as <strong>{user?.email}</strong> (staff account). Staff accounts can't place customer orders.
              </p>
              <button onClick={signOut} className="mt-5 rounded-md bg-[#E8491D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#c93c14]">
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="px-6 py-5">
              <div className="mb-4 grid grid-cols-2 gap-2">
                {[["login", "Sign in"], ["register", "Create account"]].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setAuthMode(mode); setAuthError(""); }}
                    className={`rounded-md border px-3 py-2.5 text-xs font-bold transition ${
                      authMode === mode ? "border-[#E8491D] bg-[#E8491D]/10 text-[#E8491D]" : "border-black/15 text-black/60 hover:bg-black/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mb-4 text-xs text-black/55">Sign in to place your order and track it later.</p>
              <div className="space-y-3">
                {authMode === "register" && (
                  <>
                    <input className={inputCls} placeholder="Full name" required minLength={2} value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                    <input className={inputCls} placeholder="Phone  +92 3XX XXXXXXX" required value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} />
                  </>
                )}
                <input className={inputCls} type="email" placeholder="Email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                <input className={inputCls} type="password" placeholder="Password" required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                {authMode === "register" && (
                  <p className="text-xs text-black/50">At least 8 characters with an uppercase letter, a lowercase letter and a number.</p>
                )}
              </div>
              {authError && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{authError}</p>}
              <button
                type="submit"
                disabled={authBusy}
                className="mt-5 w-full rounded-md bg-[#E8491D] py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c93c14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authBusy ? "Please wait..." : authMode === "login" ? "Sign in & continue" : "Create account & continue"}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1C1410]">Full Name</label>
                <input
                  className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#E8491D] focus:ring-2 focus:ring-[#E8491D]/10"
                  value={form.name ?? user?.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ahmed Khan"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1C1410]">Phone Number</label>
                <input
                  className="w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#E8491D] focus:ring-2 focus:ring-[#E8491D]/10"
                  value={form.phone ?? user?.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+92 3XX XXXXXXX"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1C1410]">Delivery Address</label>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#E8491D] focus:ring-2 focus:ring-[#E8491D]/10"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House, street, area, Karachi"
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1C1410]">Ordering From</label>
                <p className="rounded-md border border-black/10 bg-black/[0.03] px-3.5 py-2.5 text-sm text-black/70">
                  {restaurant?.name || "Areeba Restaurant"}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#1C1410]">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Cash on Delivery", "Card / JazzCash"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, payment: m })}
                      className={`rounded-md border px-3 py-2.5 text-xs font-bold transition ${
                        form.payment === m
                          ? "border-[#E8491D] bg-[#E8491D]/10 text-[#E8491D]"
                          : "border-black/15 text-black/60 hover:bg-black/5"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isBackendConfigured && isCustomer && (
              <p className="mt-4 text-xs text-black/50">
                Signed in as {user?.email} ·{" "}
                <button type="button" onClick={signOut} className="font-semibold text-[#E8491D] hover:underline">
                  Sign out
                </button>
              </p>
            )}

            <div className="mt-5 flex justify-between border-t border-dashed border-black/15 pt-4 text-sm">
              <span className="text-black/60">{items.length} item(s) + {formatPKR(deliveryFee)} delivery</span>
              <span className="font-extrabold text-[#1C1410]">{formatPKR(total)}</span>
            </div>

            {errors.submit && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{errors.submit}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-md bg-[#E8491D] py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#c93c14] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Placing Order..." : `Place Order — ${formatPKR(total)}`}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CheckoutModal;
