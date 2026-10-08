import { useState } from "react";
import { Bike, Search as SearchIcon, Phone, Star, Plus } from "lucide-react";

import { riders as initialRiders } from "../data/mockData";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";

const STATUS_COLOR = { "On Delivery": "orange", Available: "green", Offline: "gray" };

function Delivery() {
  const { toast } = useToast();
  const [riders, setRiders] = useState(initialRiders);

  const filterFn = (r, { search, status, zone: branchFilter }) => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || r.status === status;
    const matchesZone = !branchFilter || branchFilter === "All" || r.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesZone;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(riders, { filterFn, pageSize: 8, sortFn: (a, b) => b.deliveries - a.deliveries });

  const zones = [...new Set(initialRiders.map((r) => r.branch))];

  const cycleStatus = (id) => {
    const order = ["Available", "On Delivery", "Offline"];
    setRiders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = order[(order.indexOf(r.status) + 1) % order.length];
        toast(`${r.name} is now ${next}`, { type: "info" });
        return { ...r, status: next };
      })
    );
  };

  const stats = [
    { title: "Total Riders", value: riders.length, icon: Bike, color: "orange" },
    { title: "On Delivery", value: riders.filter((r) => r.status === "On Delivery").length, icon: Bike, color: "orange" },
    { title: "Available", value: riders.filter((r) => r.status === "Available").length, icon: Bike, color: "green" },
    {
      title: "Avg. Rating",
      value: (riders.reduce((s, r) => s + Number(r.rating), 0) / riders.length).toFixed(1),
      icon: Star,
      color: "purple",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Delivery"
        subtitle="Monitor riders across all Areeba Restaurant branches."
        actions={
          <Button onClick={() => toast("Rider invite sent", { description: "They'll receive onboarding instructions by SMS." })}>
            <Plus size={16} /> Add Rider
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} change={null} />
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search riders..." className="sm:w-64" />
          <div className="flex gap-3">
            <Select
              value={filters.zone || "All"}
              onChange={(v) => setFilter("zone", v)}
              className="w-40"
              options={[{ value: "All", label: "All Branches" }, ...zones.map((z) => ({ value: z, label: z }))]}
            />
            <Select
              value={filters.status || "All"}
              onChange={(v) => setFilter("status", v)}
              className="w-40"
              options={[
                { value: "All", label: "All Status" },
                { value: "Available", label: "Available" },
                { value: "On Delivery", label: "On Delivery" },
                { value: "Offline", label: "Offline" },
              ]}
            />
          </div>
        </div>

        {paged.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No riders found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        <Bike size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{r.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{r.vehicle} · {r.branch}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                    <Phone size={12} /> {r.phone}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                      <Star size={13} className="fill-yellow-400 text-yellow-400" /> {r.rating} · {r.deliveries} trips
                    </div>
                    <button onClick={() => cycleStatus(r.id)}>
                      <Badge color={STATUS_COLOR[r.status]} dot>
                        {r.status}
                      </Badge>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={8} />
          </>
        )}
      </Card>
    </div>
  );
}

export default Delivery;
