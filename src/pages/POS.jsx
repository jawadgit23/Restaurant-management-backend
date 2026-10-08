import { useMemo, useState } from "react";
import {
  Plus, Minus, Trash2, Receipt, Printer, X, Search as SearchIcon,
  Bike, Store, ShoppingBag, Tag, CheckCircle2,
} from "lucide-react";

import { foodItems as mockFood, foodCategories, BRANCHES as mockBranches, coupons as mockCoupons, formatPKR, DEFAULT_TAX_RATE } from "../data/mockData";
import { listFoodItems } from "../lib/api/foodItems";
import { listBranches } from "../lib/api/branches";
import { getCouponByCode } from "../lib/api/coupons";
import { placeOrder } from "../lib/api/orders";
import { useApiData } from "../hooks/useApiData";
import { isBackendConfigured } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import ReceiptContent from "../components/pos/ReceiptContent";
import PrintReceipt from "../components/pos/PrintReceipt";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";

const ORDER_TYPES = [
  { value: "Dine-in", icon: Store },
  { value: "Takeaway", icon: ShoppingBag },
  { value: "Delivery", icon: Bike },
];

const PAYMENT_METHODS = ["Cash", "Card", "JazzCash / EasyPaisa"];

function generateOrderNumber() {
  return `POS-${Math.floor(10000 + Math.random() * 89999)}`;
}

function POS() {
  const { toast } = useToast();
  const { data: branches, usingMock: usingMockBranches } = useApiData(listBranches, mockBranches, []);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [orderItems, setOrderItems] = useState([]); // {id, name, price, qty}
  const [branchChoice, setBranch] = useState(mockBranches[0].name);

  // Menu items belong to a restaurant, so the POS loads the menu of the selected branch.
  // Real branches can have different names than the demo ones – fall back to the first real branch.
  const branch = branches.some((b) => b.name === branchChoice) ? branchChoice : branches[0]?.name ?? branchChoice;
  const branchId = branches.find((b) => b.name === branch)?.id;
  const { data: foodItems, usingMock: usingMockFood } = useApiData(
    () => (isBackendConfigured && !branchId ? Promise.resolve([]) : listFoodItems(branchId)),
    mockFood,
    [branchId]
  );
  const usingMock = usingMockFood || usingMockBranches;
  const [orderType, setOrderType] = useState("Dine-in");
  const [payment, setPayment] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [placing, setPlacing] = useState(false);

  const filteredItems = useMemo(() => {
    return foodItems.filter((item) => {
      if (!item.available) return false;
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, foodItems]);

  const addItem = (item) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setOrderItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setOrderItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeItem = (id) => setOrderItems((prev) => prev.filter((i) => i.id !== id));

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCouponCode("");
    setAppliedCoupon(null);
    setOrderType("Dine-in");
    setPayment("Cash");
  };

  const subtotal = orderItems.reduce((s, i) => s + i.qty * i.price, 0);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const found = usingMock
      ? mockCoupons.find((c) => c.code === code)
      : await getCouponByCode(code).catch(() => null);
    if (!found) {
      toast("Invalid coupon code", { type: "error" });
      return;
    }
    if (found.status !== "Active") {
      toast(`Coupon ${code} is ${found.status.toLowerCase()}`, { type: "error" });
      return;
    }
    if (subtotal < found.minOrder) {
      toast(`Minimum order for ${code} is ${formatPKR(found.minOrder)}`, { type: "error" });
      return;
    }
    setAppliedCoupon(found);
    toast(`Coupon ${code} applied`, { description: "Discount added to the order." });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "Percentage") discount = Math.round((subtotal * appliedCoupon.value) / 100);
    else if (appliedCoupon.type === "Fixed") discount = appliedCoupon.value;
  }

  const deliveryFee = orderType === "Delivery" ? 150 : 0;
  const freeDelivery = appliedCoupon?.type === "Free Delivery";
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round((taxable * DEFAULT_TAX_RATE) / 100);
  const total = taxable + tax + (freeDelivery ? 0 : deliveryFee);

  const generateReceipt = async () => {
    if (orderItems.length === 0) {
      toast("Add at least one item to generate a receipt", { type: "error" });
      return;
    }

    setPlacing(true);
    try {
      let orderNumber = generateOrderNumber();

      if (isBackendConfigured) {
        orderNumber = await placeOrder({
          source: "pos",
          branch,
          customerName: customerName.trim() || "Walk-in Customer",
          customerPhone: customerPhone.trim() || null,
          orderType,
          status: "Pending",
          paymentMethod: payment,
          subtotal,
          discount,
          couponCode: appliedCoupon?.code || null,
          tax,
          deliveryFee: freeDelivery ? 0 : deliveryFee,
          total,
          items: orderItems,
        });
      }

      setReceipt({
        orderNumber,
        date: new Date(),
        branch,
        orderType,
        payment,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(),
        items: orderItems,
        subtotal,
        discount,
        coupon: appliedCoupon?.code || null,
        tax,
        deliveryFee: freeDelivery ? 0 : deliveryFee,
        total,
      });
      toast("Receipt generated", { description: `Order ${orderNumber}` });
    } catch (err) {
      toast("Couldn't record order", { type: "error", description: err.message });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1900px] p-4 sm:p-6 lg:p-8 xl:p-10">
      <PageHeader
        title="POS Terminal"
        subtitle="Build an order and generate a printable receipt for walk-in customers."
        actions={
          <Select value={branch} onChange={(v) => { setBranch(v); setOrderItems([]); }} className="w-64" options={branches.map((b) => ({ value: b.name, label: b.name }))} />
        }
      />

      {usingMock && <BackendSetupNotice className="mb-6" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* Menu picker */}
        <Card padded={false} className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
            <SearchInput value={search} onChange={setSearch} placeholder="Search menu items..." className="sm:w-72" />
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-5 py-3 [-ms-overflow-style:none] [scrollbar-width:none] dark:border-zinc-800 [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setCategory("All")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                category === "All" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              All
            </button>
            {foodCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  category === c ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <SearchIcon size={24} className="text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No items match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="group min-w-0 overflow-hidden rounded-lg border border-slate-200 text-left transition hover:border-orange-300 hover:shadow-md dark:border-zinc-800"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    <img src={item.photo} alt={item.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <Plus size={22} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-zinc-100">{item.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-orange-600">{formatPKR(item.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Current order panel */}
        <Card padded={false} className="h-fit lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-zinc-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Current Order</h2>
            {orderItems.length > 0 && (
              <button onClick={clearOrder} className="text-xs font-semibold text-red-600 hover:text-red-700">
                Clear
              </button>
            )}
          </div>

          {/* Order type */}
          <div className="grid grid-cols-3 gap-2 p-5 pb-0">
            {ORDER_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setOrderType(t.value)}
                  className={`flex flex-col items-center gap-1 rounded-md border py-2.5 text-xs font-bold transition ${
                    orderType === t.value
                      ? "border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <Icon size={16} /> {t.value}
                </button>
              );
            })}
          </div>

          {/* Items list */}
          <div className="max-h-64 overflow-y-auto px-5 py-4">
            {orderItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatPKR(item.price)} each</p>
                    </div>
                    <div className="flex items-center rounded-md border border-slate-200 dark:border-zinc-700">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400">
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-900 dark:text-zinc-100">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {formatPKR(item.qty * item.price)}
                    </span>
                    <button onClick={() => removeItem(item.id)} className="shrink-0 text-slate-300 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="space-y-3 border-t border-slate-200 p-5 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            {/* Coupon */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Tag size={13} /> {appliedCoupon.code} applied
                </span>
                <button onClick={removeCoupon} className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  placeholder="Coupon code"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <Button variant="secondary" size="sm" onClick={applyCoupon}>Apply</Button>
              </div>
            )}

            <Select
              value={payment}
              onChange={setPayment}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t border-slate-200 p-5 text-sm dark:border-zinc-800">
            <div className="flex justify-between text-slate-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-semibold">-{formatPKR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-zinc-400">
              <span>Tax ({DEFAULT_TAX_RATE}%)</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(tax)}</span>
            </div>
            {orderType === "Delivery" && (
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {freeDelivery ? "Free" : formatPKR(deliveryFee)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2 text-base dark:border-zinc-700">
              <span className="font-bold text-slate-900 dark:text-zinc-100">Total</span>
              <span className="font-extrabold text-orange-600">{formatPKR(total)}</span>
            </div>
          </div>

          <div className="p-5 pt-0">
            <Button className="w-full" onClick={generateReceipt} disabled={placing}>
              <Receipt size={16} /> {placing ? "Placing Order..." : "Generate Receipt"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Receipt modal */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Order Receipt" size="sm">
        {receipt && (
          <>
            <ReceiptContent receipt={receipt} />

            <div className="mt-5 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Order recorded successfully
            </div>

            <div className="mt-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
                <Printer size={15} /> Print
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setReceipt(null);
                  clearOrder();
                }}
              >
                New Order
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Hidden, print-only copy rendered flat under <body> — see PrintReceipt.jsx */}
      <PrintReceipt receipt={receipt} />
    </div>
  );
}

export default POS;
