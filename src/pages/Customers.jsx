import { useState } from "react";
import { Users, Search as SearchIcon, Mail, Phone, MapPin, Trash2, UserPlus, ShoppingBag, DollarSign } from "lucide-react";

import { customers as initialCustomers, formatPKR } from "../data/mockData";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState(initialCustomers);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filterFn = (c, { search, status }) => {
    const matchesSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || c.status === status;
    return matchesSearch && matchesStatus;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(customers, { filterFn, pageSize: 8, sortFn: (a, b) => b.orders - a.orders });

  const handleDelete = () => {
    setCustomers((prev) => prev.filter((c) => c.id !== deleting.id));
    toast("Customer removed", { type: "info", description: `${deleting.name} was deleted.` });
    setDeleting(null);
    setViewing(null);
  };

  const stats = [
    { title: "Total Customers", value: customers.length, icon: Users, color: "orange" },
    { title: "Active", value: customers.filter((c) => c.status === "Active").length, icon: UserPlus, color: "green" },
    {
      title: "Avg. Orders",
      value: (customers.reduce((s, c) => s + c.orders, 0) / customers.length).toFixed(1),
      icon: ShoppingBag,
      color: "blue",
    },
    {
      title: "Total Spend",
      value: formatPKR(customers.reduce((s, c) => s + Number(c.spent), 0)),
      icon: DollarSign,
      color: "purple",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Customers" subtitle="View and manage registered customers." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} change={null} />
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="sm:w-72" />
          <Select
            value={filters.status || "All"}
            onChange={(v) => setFilter("status", v)}
            className="sm:w-40"
            options={[
              { value: "All", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />
        </div>

        {paged.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No customers found" description="Try a different search term." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-6 py-3.5 font-medium">Customer</th>
                    <th className="px-6 py-3.5 font-medium">Location</th>
                    <th className="px-6 py-3.5 font-medium">Orders</th>
                    <th className="px-6 py-3.5 font-medium">Total Spent</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setViewing(c)}
                      className="cursor-pointer border-b border-slate-100 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                            {initials(c.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{c.name}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{c.location}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{c.orders}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(c.spent)}</td>
                      <td className="px-6 py-3.5">
                        <Badge color={c.status === "Active" ? "green" : "gray"} dot>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(c);
                          }}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {paged.map((c) => (
                <button key={c.id} onClick={() => setViewing(c)} className="w-full rounded-lg border border-slate-200 p-4 text-left dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{c.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{c.email}</p>
                    </div>
                    <Badge color={c.status === "Active" ? "green" : "gray"}>{c.status}</Badge>
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-slate-500 dark:text-zinc-400">
                    <span>{c.orders} orders</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(c.spent)}</span>
                  </div>
                </button>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={8} />
          </>
        )}
      </Card>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name} subtitle="Customer profile">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                {initials(viewing.name)}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">{viewing.name}</p>
                <Badge color={viewing.status === "Active" ? "green" : "gray"}>{viewing.status}</Badge>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-zinc-800/60">
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                <Mail size={15} /> {viewing.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                <Phone size={15} /> {viewing.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                <MapPin size={15} /> {viewing.location}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-zinc-800">
                <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{viewing.orders}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Orders</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-zinc-800">
                <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{formatPKR(viewing.spent)}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Spent</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-zinc-800">
                <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{viewing.joined}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Joined</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove customer"
        description={`${deleting?.name}'s account and order history will be permanently deleted.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default Customers;
