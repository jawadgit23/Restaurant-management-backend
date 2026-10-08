import { useState } from "react";
import { Ticket, Plus, Pencil, Trash2, Copy, Percent, Tag } from "lucide-react";

import { coupons as mockCoupons, formatPKR } from "../data/mockData";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../lib/api/coupons";
import { useApiData } from "../hooks/useApiData";
import { useActiveRestaurant } from "../hooks/useActiveRestaurant";
import { useAuth } from "../context/AuthContext";
import RestaurantPicker from "../components/dashboard/RestaurantPicker";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Field, { inputClass } from "../components/ui/Field";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";

const STATUS_COLOR = { Active: "green", Expired: "red", Paused: "yellow" };

const emptyForm = { code: "", type: "Percentage", value: 10, status: "Active", expiry: "", minOrder: 0, maxUses: 500 };

function Coupons() {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { restaurants, restaurantId, setRestaurantId } = useActiveRestaurant();
  const { data: coupons, setData: setCoupons, loading, usingMock } = useApiData(listCoupons, mockCoupons, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm(c);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast("Please enter a coupon code", { type: "error" });
      return;
    }
    const payload = { ...form, code: form.code.toUpperCase() };
    try {
      if (editing) {
        if (usingMock) {
          setCoupons((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)));
        } else {
          const updated = await updateCoupon(editing.id, payload);
          setCoupons((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        }
        toast("Coupon updated", { description: `${payload.code} was saved.` });
      } else {
        if (usingMock) {
          const newCoupon = { ...payload, id: `CPN-${String(100 + coupons.length + 1).padStart(3, "0")}`, uses: 0 };
          setCoupons((prev) => [newCoupon, ...prev]);
        } else {
          const created = await createCoupon({ ...payload, uses: 0 });
          setCoupons((prev) => [created, ...prev]);
        }
        toast("Coupon created", { description: `${payload.code} is now active.` });
      }
      setModalOpen(false);
    } catch (err) {
      toast("Something went wrong", { type: "error", description: err.message });
    }
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteCoupon(deleting.id);
      setCoupons((prev) => prev.filter((c) => c.id !== deleting.id));
      toast("Coupon deleted", { type: "info", description: `${deleting.code} was removed.` });
    } catch (err) {
      toast("Couldn't delete coupon", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast("Code copied", { description: `${code} copied to clipboard.` });
  };

  const togglePause = async (c) => {
    const newStatus = c.status === "Active" ? "Paused" : "Active";
    setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)));
    if (!usingMock) {
      try {
        await updateCoupon(c.id, { ...c, status: newStatus });
      } catch (err) {
        setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: c.status } : x)));
        toast("Couldn't update coupon", { type: "error", description: err.message });
        return;
      }
    }
    toast(`Coupon ${newStatus.toLowerCase()}`, { description: `${c.code} is now ${newStatus.toLowerCase()}.` });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.filter((c) => c.status === "Active").length} active coupons of ${coupons.length} total.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {!isSuperAdmin && <RestaurantPicker restaurants={restaurants} value={restaurantId} onChange={setRestaurantId} />}
            <Button onClick={openAdd}>
              <Plus size={16} /> Create Coupon
            </Button>
          </div>
        }
      />

      {usingMock && <BackendSetupNotice className="mb-6" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <EmptyState icon={Ticket} title="No coupons yet" description="Create your first coupon to start offering discounts." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const pct = Math.min(100, Math.round((c.uses / c.maxUses) * 100));
            return (
              <div key={c.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-dashed border-slate-300 p-4 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                      {c.type === "Percentage" ? <Percent size={16} /> : <Tag size={16} />}
                    </div>
                    <button
                      onClick={() => copyCode(c.code)}
                      className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-wide text-slate-900 hover:text-orange-700 dark:text-zinc-100"
                    >
                      {c.code}
                      <Copy size={12} className="text-slate-400" />
                    </button>
                  </div>
                  <Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge>
                </div>

                <div className="p-4">
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {c.type === "Percentage" ? `${c.value}% OFF` : c.type === "Fixed" ? `${formatPKR(c.value)} OFF` : "Free Delivery"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Min. order {formatPKR(c.minOrder)} · Expires {c.expiry}</p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span>{c.uses} used</span>
                      <span>{c.maxUses} max</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                      <div className="h-full rounded-full bg-orange-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(c)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => togglePause(c)} disabled={c.status === "Expired"}>
                      {c.status === "Active" ? "Pause" : "Activate"}
                    </Button>
                    <button
                      onClick={() => setDeleting(c)}
                      className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Coupon" : "Create Coupon"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Coupon Code" required hint="Will be uppercased automatically">
            <input className={`${inputClass} font-mono uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SMASH20" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type">
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={[
                  { value: "Percentage", label: "Percentage" },
                  { value: "Fixed", label: "Fixed Amount" },
                  { value: "Free Delivery", label: "Free Delivery" },
                ]}
              />
            </Field>
            <Field label={form.type === "Percentage" ? "Value (%)" : "Value (Rs)"}>
              <input
                type="number"
                className={inputClass}
                value={form.value}
                disabled={form.type === "Free Delivery"}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Order (Rs)">
              <input type="number" className={inputClass} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
            </Field>
            <Field label="Max Uses">
              <input type="number" className={inputClass} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Expiry Date">
            <input type="date" className={inputClass} value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save Changes" : "Create Coupon"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete coupon"
        description={`${deleting?.code} will be permanently deleted and can no longer be redeemed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default Coupons;
