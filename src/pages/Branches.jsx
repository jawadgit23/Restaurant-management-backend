import { useState } from "react";
import { Plus, Search as SearchIcon, Star, MapPin, Phone, Pencil, Trash2, MoreVertical, Store, User } from "lucide-react";

import { BRANCHES as mockBranches, formatPKR } from "../data/mockData";
import { listBranches, createBranch, updateBranch, deleteBranch } from "../lib/api/branches";
import { useApiData } from "../hooks/useApiData";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Field, { inputClass } from "../components/ui/Field";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";

const STATUS_COLOR = { Active: "green", "Under Renovation": "yellow", Closed: "red" };

const emptyForm = { name: "", manager: "", address: "", phone: "", area: "", status: "Active" };

function Branches() {
  const { toast } = useToast();
  const { data: branches, setData: setBranches, loading, usingMock } =
    useApiData(listBranches, mockBranches, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const filterFn = (b, { search, status }) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.manager.toLowerCase().includes(search.toLowerCase()) ||
      b.area.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || b.status === status;
    return matchesSearch && matchesStatus;
  };

  const { search, setSearch, filters, setFilter, filtered } =
    usePaginatedList(branches, { filterFn, pageSize: 20 });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm(b);
    setModalOpen(true);
    setMenuOpenId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.manager.trim() || !form.address.trim()) {
      toast("Please fill in all required fields", { type: "error" });
      return;
    }
    try {
      if (editing) {
        if (usingMock) {
          setBranches((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...form } : b)));
        } else {
          const updated = await updateBranch(editing.id, form);
          setBranches((prev) => prev.map((b) => (b.id === editing.id ? updated : b)));
        }
        toast("Branch updated", { description: `${form.name} was saved.` });
      } else {
        if (usingMock) {
          const newBranch = {
            ...form,
            id: `BR-${String(branches.length + 1).padStart(2, "0")}`,
            rating: "0.0",
            orders: 0,
            monthlyRevenue: 0,
            opened: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          };
          setBranches((prev) => [newBranch, ...prev]);
        } else {
          const created = await createBranch({
            ...form,
            rating: "0.0",
            orders: 0,
            monthlyRevenue: 0,
            opened: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          });
          setBranches((prev) => [created, ...prev]);
        }
        toast("Branch added", { description: `${form.name} is now live.` });
      }
      setModalOpen(false);
    } catch (err) {
      toast("Something went wrong", { type: "error", description: err.message });
    }
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteBranch(deleting.id);
      setBranches((prev) => prev.filter((b) => b.id !== deleting.id));
      toast("Branch removed", { type: "info", description: `${deleting.name} was deleted.` });
    } catch (err) {
      toast("Couldn't delete branch", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const totalOrders = branches.reduce((s, b) => s + b.orders, 0);
  const totalRevenue = branches.reduce((s, b) => s + b.monthlyRevenue, 0);
  const avgRating = (branches.reduce((s, b) => s + Number(b.rating), 0) / branches.length).toFixed(1);

  const stats = [
    { title: "Total Branches", value: branches.length, icon: Store, color: "orange" },
    { title: "Monthly Orders", value: totalOrders.toLocaleString(), icon: Store, color: "blue" },
    { title: "Monthly Revenue", value: formatPKR(totalRevenue), icon: Store, color: "green" },
    { title: "Avg. Rating", value: avgRating, icon: Star, color: "purple" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8" onClick={() => setMenuOpenId(null)}>
      <PageHeader
        title="Branches"
        subtitle="Managing all Areeba Restaurant locations across Karachi."
        actions={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Branch
          </Button>
        }
      />

      {usingMock && <BackendSetupNotice className="mb-6" />}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} change={null} />
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search branches, managers, or areas..." className="sm:w-80" />
          <Select
            value={filters.status || "All"}
            onChange={(v) => setFilter("status", v)}
            className="w-44"
            options={[
              { value: "All", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Under Renovation", label: "Under Renovation" },
              { value: "Closed", label: "Closed" },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No branches found" description="Try a different search or add a new branch." />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((b) => (
              <div key={b.id} className="relative rounded-lg border border-slate-200 p-4 transition hover:shadow-md dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 dark:bg-orange-600">
                      <Store size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{b.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                        <User size={11} /> {b.manager}
                      </p>
                    </div>
                  </div>

                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === b.id ? null : b.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpenId === b.id && (
                      <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                        <button
                          onClick={() => openEdit(b)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(b);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="shrink-0" /> {b.address}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="shrink-0" /> {b.phone}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-zinc-100">
                    <Star size={14} className="fill-amber-400 text-amber-400" /> {b.rating}
                    <span className="text-xs font-normal text-slate-400">({b.orders} orders/mo)</span>
                  </div>
                  <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Branch" : "Add Branch"}
        subtitle={editing ? "Update branch details" : "Open a new Areeba Restaurant location"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Branch Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Areeba Restaurant – Bahadurabad" />
          </Field>
          <Field label="Manager Name" required>
            <input className={inputClass} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="e.g. Ali Raza" />
          </Field>
          <Field label="Address" required>
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Block 6, Bahadurabad, Karachi" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Area">
              <input className={inputClass} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Bahadurabad" />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 21 ..." />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: "Active", label: "Active" },
                { value: "Under Renovation", label: "Under Renovation" },
                { value: "Closed", label: "Closed" },
              ]}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save Changes" : "Add Branch"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove branch"
        description={`${deleting?.name} will be removed from the system. This won't affect past order history.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default Branches;
