import { useState } from "react";
import { Plus, Search as SearchIcon, Pencil, Trash2, Star } from "lucide-react";

import { foodItems as mockFood, foodCategories, formatPKR } from "../data/mockData";
import { listFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from "../lib/api/foodItems";
import { useApiData } from "../hooks/useApiData";
import { isBackendConfigured } from "../lib/apiClient";
import { useActiveRestaurant } from "../hooks/useActiveRestaurant";
import RestaurantPicker from "../components/dashboard/RestaurantPicker";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Field, { inputClass } from "../components/ui/Field";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";

const STOCK_COLOR = { "In Stock": "green", "Low Stock": "yellow", "Out of Stock": "red" };

const FALLBACK_PHOTO = "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600";

const emptyForm = { name: "", category: foodCategories[0], price: "", stock: "In Stock", available: true, photo: "", photoFile: null };

function FoodMenu() {
  const { toast } = useToast();
  const { restaurants, restaurantId, setRestaurantId } = useActiveRestaurant();
  const { data: items, setData: setItems, loading, usingMock } = useApiData(
    () => (isBackendConfigured && !restaurantId ? Promise.resolve([]) : listFoodItems(restaurantId)),
    mockFood,
    [restaurantId]
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState(null);

  const filterFn = (item, { search, category }) => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(items, { filterFn, pageSize: 9 });

  const toggleAvailable = async (item) => {
    const next = !item.available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: next } : i)));
    if (!usingMock) {
      try {
        await updateFoodItem(item.id, { ...item, available: next });
      } catch (err) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: !next } : i)));
        toast("Couldn't update availability", { type: "error", description: err.message });
      }
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast("Please fill in all required fields", { type: "error" });
      return;
    }
    try {
      if (editing) {
        if (usingMock) {
          setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...form } : i)));
        } else {
          const updated = await updateFoodItem(editing.id, form);
          setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
        }
        toast("Item updated", { description: `${form.name} was saved.` });
      } else {
        const payload = { ...form, orders: 0, rating: "0.0", photo: form.photo || FALLBACK_PHOTO };
        if (usingMock) {
          const newItem = { ...payload, id: `FD-${2000 + items.length + Math.floor(Math.random() * 900)}` };
          setItems((prev) => [newItem, ...prev]);
        } else {
          const created = await createFoodItem(payload);
          setItems((prev) => [created, ...prev]);
        }
        toast("Item added", { description: `${form.name} added to the menu.` });
      }
      setModalOpen(false);
    } catch (err) {
      toast("Something went wrong", { type: "error", description: err.message });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Unsupported file", { type: "error", description: "Please choose a JPEG, PNG or WebP image." });
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image too large", { type: "error", description: "Pictures must be 5 MB or smaller." });
      e.target.value = "";
      return;
    }
    setForm((f) => ({ ...f, photoFile: file, photo: URL.createObjectURL(file) })); // local preview until it is uploaded
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteFoodItem(deleting.id);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      toast("Item removed", { type: "info", description: `${deleting.name} was deleted.` });
    } catch (err) {
      toast("Couldn't delete item", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Food Menu"
        subtitle={usingMock ? `${items.length} items served across all Areeba Restaurant branches.` : `${items.length} items on this branch's menu.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <RestaurantPicker restaurants={restaurants} value={restaurantId} onChange={setRestaurantId} />
            <Button onClick={openAdd}>
              <Plus size={16} /> Add Item
            </Button>
          </div>
        }
      />

      {usingMock && <BackendSetupNotice className="mb-6" />}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search food items..." className="sm:w-72" />
          <Select
            value={filters.category || "All"}
            onChange={(v) => setFilter("category", v)}
            className="sm:w-44"
            options={[{ value: "All", label: "All Categories" }, ...foodCategories.map((c) => ({ value: c, label: c }))]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : paged.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No items found" description="Try a different search or add a new menu item." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200 transition hover:shadow-md dark:border-zinc-800">
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    <img src={item.photo || FALLBACK_PHOTO} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {formatPKR(item.price)}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{item.name}</h3>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge color="orange">{item.category}</Badge>
                      <Badge color={STOCK_COLOR[item.stock]}>{item.stock}</Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                        <Star size={13} className="fill-amber-400 text-amber-400" /> {item.rating} · {item.orders} orders
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAvailable(item)}
                          title={item.available ? "Mark unavailable" : "Mark available"}
                          className={`relative h-5 w-9 rounded-full transition ${item.available ? "bg-orange-600" : "bg-slate-300 dark:bg-zinc-700"}`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                              item.available ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                        <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleting(item)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={9} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Item" : "Add Food Item"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Item Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Whole Chicken Sajji" />
          </Field>
          <Field label="Photo" hint={usingMock ? "JPEG, PNG or WebP, up to 5 MB. (Demo mode: the photo is only kept in this browser tab.)" : "JPEG, PNG or WebP, up to 5 MB. It is uploaded to Cloudinary when you save."}>
            <div className="flex items-center gap-3">
              <img src={form.photo || FALLBACK_PHOTO} alt="Preview" className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-zinc-700" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100 dark:text-zinc-300 dark:file:bg-orange-500/10 dark:file:text-orange-400"
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={foodCategories.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Price (Rs)" required>
              <input type="number" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="650" />
            </Field>
          </div>
          <Field label="Stock Status">
            <Select
              value={form.stock}
              onChange={(v) => setForm({ ...form, stock: v })}
              options={[
                { value: "In Stock", label: "In Stock" },
                { value: "Low Stock", label: "Low Stock" },
                { value: "Out of Stock", label: "Out of Stock" },
              ]}
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

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete menu item"
        description={`${deleting?.name} will be permanently removed from the menu.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default FoodMenu;
