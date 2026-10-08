import { useState } from "react";
import {
  Plus, Search as SearchIcon, Pencil, Trash2, PackagePlus,
  AlertTriangle, Download, Boxes, DollarSign,
} from "lucide-react";

import {
  inventoryItems as mockInventoryItems, inventoryCategories, inventoryUnits,
  vendors as mockVendors, BRANCHES as mockBranches, formatPKR, getStockStatus,
} from "../data/mockData";
import { listInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../lib/api/inventory";
import { listVendors } from "../lib/api/vendors";
import { listBranches } from "../lib/api/branches";
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

const STATUS_COLOR = { "In Stock": "green", "Low Stock": "yellow", "Out of Stock": "red" };

function emptyForm(vendors, branches) {
  return {
    name: "",
    category: inventoryCategories[0],
    unit: inventoryUnits[0],
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    vendor: vendors[0]?.name || "",
    branch: branches[0]?.name || "",
  };
}

function downloadCSV(rows) {
  const header = "Item,Category,Stock,Unit,Reorder Level,Cost/Unit,Vendor,Branch,Status\n";
  const body = rows
    .map(
      (i) =>
        `${i.name},${i.category},${i.currentStock},${i.unit},${i.reorderLevel},${i.costPerUnit},${i.vendor},${i.branch},${getStockStatus(i)}`
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Inventory() {
  const { toast } = useToast();
  const { data: items, setData: setItems, loading, usingMock } =
    useApiData(listInventoryItems, mockInventoryItems, []);
  const { data: vendors } = useApiData(listVendors, mockVendors, []);
  const { data: branches } = useApiData(listBranches, mockBranches, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(mockVendors, mockBranches));
  const [deleting, setDeleting] = useState(null);
  const [restocking, setRestocking] = useState(null);
  const [restockQty, setRestockQty] = useState("");

  const filterFn = (i, { search, category, status, branch }) => {
    const matchesSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || category === "All" || i.category === category;
    const matchesStatus = !status || status === "All" || getStockStatus(i) === status;
    const matchesBranch = !branch || branch === "All" || i.branch === branch;
    return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
  };

  const { search, setSearch, filters, setFilter, filtered } =
    usePaginatedList(items, { filterFn, pageSize: 100 });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(vendors, branches));
    setModalOpen(true);
  };

  const openEdit = (i) => {
    setEditing(i);
    setForm(i);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.vendor || !form.branch) {
      toast("Please fill in all required fields", { type: "error" });
      return;
    }
    const payload = {
      ...form,
      currentStock: Number(form.currentStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      costPerUnit: Number(form.costPerUnit) || 0,
    };
    try {
      if (editing) {
        if (usingMock) {
          setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...payload } : i)));
        } else {
          const updated = await updateInventoryItem(editing.id, payload);
          setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        }
        toast("Item updated", { description: `${payload.name} was saved.` });
      } else {
        const withRestock = { ...payload, lastRestocked: new Date().toISOString().slice(0, 10) };
        if (usingMock) {
          const newItem = { ...withRestock, id: `INV-${String(items.length + 1).padStart(3, "0")}` };
          setItems((prev) => [newItem, ...prev]);
        } else {
          const created = await createInventoryItem(withRestock);
          setItems((prev) => [created, ...prev]);
        }
        toast("Item added", { description: `${payload.name} is now tracked in inventory.` });
      }
      setModalOpen(false);
    } catch (err) {
      toast("Something went wrong", { type: "error", description: err.message });
    }
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteInventoryItem(deleting.id);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      toast("Item removed", { type: "info", description: `${deleting.name} was deleted.` });
    } catch (err) {
      toast("Couldn't delete item", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const qty = Number(restockQty);
    if (!qty || qty <= 0) {
      toast("Enter a valid quantity", { type: "error" });
      return;
    }
    const updated = {
      ...restocking,
      currentStock: restocking.currentStock + qty,
      lastRestocked: new Date().toISOString().slice(0, 10),
    };
    try {
      if (usingMock) {
        setItems((prev) => prev.map((i) => (i.id === restocking.id ? updated : i)));
      } else {
        const saved = await updateInventoryItem(restocking.id, updated);
        setItems((prev) => prev.map((i) => (i.id === restocking.id ? saved : i)));
      }
      toast("Stock updated", { description: `+${qty} ${restocking.unit} added to ${restocking.name}.` });
      setRestocking(null);
      setRestockQty("");
    } catch (err) {
      toast("Couldn't update stock", { type: "error", description: err.message });
    }
  };

  const lowStockCount = items.filter((i) => getStockStatus(i) === "Low Stock").length;
  const outOfStockCount = items.filter((i) => getStockStatus(i) === "Out of Stock").length;
  const totalValue = items.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0);

  const stats = [
    { title: "Tracked Items", value: items.length, icon: Boxes, color: "orange" },
    { title: "Low Stock", value: lowStockCount, icon: AlertTriangle, color: "yellow" },
    { title: "Out of Stock", value: outOfStockCount, icon: AlertTriangle, color: "red" },
    { title: "Inventory Value", value: formatPKR(totalValue), icon: DollarSign, color: "green" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Inventory"
        subtitle="Track raw ingredients and supplies used across the kitchen."
        actions={
          <>
            <Button variant="secondary" onClick={() => downloadCSV(filtered)}>
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={openAdd}>
              <Plus size={16} /> Add Item
            </Button>
          </>
        }
      />

      {usingMock && <BackendSetupNotice className="mb-6" />}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} change={null} />
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search items or vendors..." className="sm:w-64" />
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.category || "All"}
              onChange={(v) => setFilter("category", v)}
              className="w-48"
              options={[{ value: "All", label: "All Categories" }, ...inventoryCategories.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              value={filters.status || "All"}
              onChange={(v) => setFilter("status", v)}
              className="w-40"
              options={[
                { value: "All", label: "All Status" },
                { value: "In Stock", label: "In Stock" },
                { value: "Low Stock", label: "Low Stock" },
                { value: "Out of Stock", label: "Out of Stock" },
              ]}
            />
            <Select
              value={filters.branch || "All"}
              onChange={(v) => setFilter("branch", v)}
              className="w-56"
              options={[{ value: "All", label: "All Branches" }, ...branches.map((b) => ({ value: b.name, label: b.name }))]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No items found" description="Try adjusting your search or filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-6 py-3.5 font-medium">Item</th>
                    <th className="px-6 py-3.5 font-medium">Category</th>
                    <th className="px-6 py-3.5 font-medium">Stock</th>
                    <th className="px-6 py-3.5 font-medium">Reorder At</th>
                    <th className="px-6 py-3.5 font-medium">Cost/Unit</th>
                    <th className="px-6 py-3.5 font-medium">Vendor</th>
                    <th className="px-6 py-3.5 font-medium">Branch</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const status = getStockStatus(i);
                    return (
                      <tr key={i.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40">
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">{i.name}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{i.category}</td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">{i.currentStock} {i.unit}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-zinc-400">{i.reorderLevel} {i.unit}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{formatPKR(i.costPerUnit)}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{i.vendor}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{i.branch}</td>
                        <td className="px-6 py-3.5"><Badge color={STATUS_COLOR[status]} dot>{status}</Badge></td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setRestocking(i)}
                              title="Restock"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                            >
                              <PackagePlus size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(i)}
                              title="Edit"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleting(i)}
                              title="Delete"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 lg:hidden">
              {filtered.map((i) => {
                const status = getStockStatus(i);
                return (
                  <div key={i.id} className="rounded-lg border border-slate-200 p-4 dark:border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{i.name}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{i.category} · {i.branch}</p>
                      </div>
                      <Badge color={STATUS_COLOR[status]} dot>{status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span>Stock: <span className="font-semibold text-slate-900 dark:text-zinc-100">{i.currentStock} {i.unit}</span></span>
                      <span>Reorder at: {i.reorderLevel} {i.unit}</span>
                      <span>Cost/unit: {formatPKR(i.costPerUnit)}</span>
                      <span>Vendor: {i.vendor}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
                      <Button variant="secondary" size="sm" onClick={() => setRestocking(i)}>
                        <PackagePlus size={13} /> Restock
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(i)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <button onClick={() => setDeleting(i)} className="ml-auto text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Inventory Item" : "Add Inventory Item"}
        subtitle={editing ? "Update stock details" : "Track a new ingredient or supply"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Item Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Whole Chicken" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={inventoryCategories.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} options={inventoryUnits.map((u) => ({ value: u, label: u }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Current Stock" required>
              <input type="number" min="0" step="0.1" className={inputClass} value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
            </Field>
            <Field label="Reorder Level" hint="Alert when stock drops to or below this">
              <input type="number" min="0" step="0.1" className={inputClass} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            </Field>
          </div>
          <Field label="Cost per Unit (Rs)" required>
            <input type="number" min="0" step="0.01" className={inputClass} value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
          </Field>
          <Field label="Vendor" required hint="Which supplier this is purchased from">
            <Select
              value={form.vendor}
              onChange={(v) => setForm({ ...form, vendor: v })}
              options={vendors.map((v) => ({ value: v.name, label: v.name }))}
            />
          </Field>
          <Field label="Branch" required>
            <Select
              value={form.branch}
              onChange={(v) => setForm({ ...form, branch: v })}
              options={branches.map((b) => ({ value: b.name, label: b.name }))}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </Modal>

      {/* Restock modal */}
      <Modal
        open={!!restocking}
        onClose={() => {
          setRestocking(null);
          setRestockQty("");
        }}
        title="Restock Item"
        subtitle={restocking ? `${restocking.name} · currently ${restocking.currentStock} ${restocking.unit}` : ""}
        size="sm"
      >
        <form onSubmit={handleRestock} className="space-y-4">
          <Field label={`Quantity to add (${restocking?.unit || ""})`} required>
            <input
              type="number"
              min="0.1"
              step="0.1"
              autoFocus
              className={inputClass}
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="e.g. 20"
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setRestocking(null); setRestockQty(""); }}>
              Cancel
            </Button>
            <Button type="submit">
              <PackagePlus size={15} /> Add Stock
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove item"
        description={`${deleting?.name} will be removed from inventory tracking.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default Inventory;
