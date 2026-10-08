import { useState } from "react";
import {
  Plus, Search as SearchIcon, Truck, Phone, Mail, MapPin,
  Pencil, Trash2, MoreVertical, User, Package, Tag,
} from "lucide-react";

import { vendors as mockVendors, vendorCategories, inventoryItems as mockInventoryItems, formatPKR } from "../data/mockData";
import { listVendors, createVendor, updateVendor, deleteVendor } from "../lib/api/vendors";
import { listInventoryItems } from "../lib/api/inventory";
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

const STATUS_COLOR = { Active: "green", Inactive: "gray" };

const emptyForm = {
  name: "",
  category: vendorCategories[0],
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  status: "Active",
};

function Vendors() {
  const { toast } = useToast();
  const { data: vendors, setData: setVendors, loading, usingMock } =
    useApiData(listVendors, mockVendors, []);
  // Pulled in purely to show "what we purchase from them" on each vendor's card.
  const { data: inventoryItems } = useApiData(listInventoryItems, mockInventoryItems, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const filterFn = (v, { search, category, status }) => {
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || category === "All" || v.category === category;
    const matchesStatus = !status || status === "All" || v.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  };

  const { search, setSearch, filters, setFilter, filtered } =
    usePaginatedList(vendors, { filterFn, pageSize: 50 });

  const itemsFor = (vendorName) => inventoryItems.filter((i) => i.vendor === vendorName);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm(v);
    setModalOpen(true);
    setMenuOpenId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactPerson.trim() || !form.phone.trim()) {
      toast("Please fill in all required fields", { type: "error" });
      return;
    }
    try {
      if (editing) {
        if (usingMock) {
          setVendors((prev) => prev.map((v) => (v.id === editing.id ? { ...v, ...form } : v)));
        } else {
          const updated = await updateVendor(editing.id, form);
          setVendors((prev) => prev.map((v) => (v.id === editing.id ? updated : v)));
        }
        toast("Vendor updated", { description: `${form.name} was saved.` });
      } else {
        if (usingMock) {
          const newVendor = { ...form, id: `VN-${String(vendors.length + 1).padStart(2, "0")}` };
          setVendors((prev) => [newVendor, ...prev]);
        } else {
          const created = await createVendor(form);
          setVendors((prev) => [created, ...prev]);
        }
        toast("Vendor added", { description: `${form.name} is now registered.` });
      }
      setModalOpen(false);
    } catch (err) {
      toast("Something went wrong", { type: "error", description: err.message });
    }
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteVendor(deleting.id);
      setVendors((prev) => prev.filter((v) => v.id !== deleting.id));
      toast("Vendor removed", { type: "info", description: `${deleting.name} was deleted.` });
    } catch (err) {
      toast("Couldn't delete vendor", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const activeCount = vendors.filter((v) => v.status === "Active").length;
  const categoriesCovered = new Set(vendors.map((v) => v.category)).size;
  const totalStockValue = inventoryItems.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0);

  const stats = [
    { title: "Registered Vendors", value: vendors.length, icon: Truck, color: "orange" },
    { title: "Active Vendors", value: activeCount, icon: Truck, color: "green" },
    { title: "Categories Covered", value: categoriesCovered, icon: Tag, color: "blue" },
    { title: "Current Stock Value", value: formatPKR(totalStockValue), icon: Package, color: "purple" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8" onClick={() => setMenuOpenId(null)}>
      <PageHeader
        title="Vendors"
        subtitle="Registered suppliers you purchase ingredients and supplies from."
        actions={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Vendor
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search vendors, contacts, or category..." className="sm:w-80" />
          <div className="flex gap-3">
            <Select
              value={filters.category || "All"}
              onChange={(v) => setFilter("category", v)}
              className="w-52"
              options={[{ value: "All", label: "All Categories" }, ...vendorCategories.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              value={filters.status || "All"}
              onChange={(v) => setFilter("status", v)}
              className="w-36"
              options={[
                { value: "All", label: "All Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No vendors found" description="Try a different search or add a new vendor." />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => {
              const supplied = itemsFor(v.name);
              const stockValue = supplied.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0);
              return (
                <div key={v.id} className="relative rounded-lg border border-slate-200 p-4 transition hover:shadow-md dark:border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 dark:bg-orange-600">
                        <Truck size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{v.name}</h3>
                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                          <User size={11} /> {v.contactPerson}
                        </p>
                      </div>
                    </div>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === v.id ? null : v.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpenId === v.id && (
                        <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                          <button
                            onClick={() => openEdit(v)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleting(v);
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

                  <div className="mt-3">
                    <Badge color="orange">{v.category}</Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="shrink-0" /> {v.phone}
                    </div>
                    {v.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="shrink-0" /> {v.email}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0" /> {v.address}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      <Package size={13} /> What we purchase from them
                    </p>
                    {supplied.length === 0 ? (
                      <p className="mt-1.5 text-xs text-slate-400">No inventory items linked yet.</p>
                    ) : (
                      <>
                        <p className="mt-1.5 truncate text-xs text-slate-600 dark:text-zinc-300">
                          {supplied.slice(0, 3).map((i) => i.name).join(", ")}
                          {supplied.length > 3 ? ` +${supplied.length - 3} more` : ""}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {supplied.length} item{supplied.length !== 1 ? "s" : ""} · {formatPKR(stockValue)} in current stock
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <Badge color={STATUS_COLOR[v.status]} dot>{v.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vendor" : "Add Vendor"}
        subtitle={editing ? "Update vendor details" : "Register a new supplier"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Vendor / Company Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Karachi Meat Suppliers" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={vendorCategories.map((c) => ({ value: c, label: c }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Person" required>
              <input className={inputClass} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Rashid Mehmood" />
            </Field>
            <Field label="Phone" required>
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 3XX XXXXXXX" />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vendor@example.com" />
          </Field>
          <Field label="Address">
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Sabzi Mandi, Karachi" />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save Changes" : "Add Vendor"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove vendor"
        description={`${deleting?.name} will be removed from the system. Inventory items already linked to them will keep showing this vendor's name.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default Vendors;
