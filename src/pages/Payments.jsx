import { useState } from "react";
import { CreditCard, Search as SearchIcon, Download, Smartphone, Banknote, DollarSign } from "lucide-react";

import { payments as initialPayments, formatDate, formatPKR } from "../data/mockData";
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

const STATUS_COLOR = { Completed: "green", Pending: "yellow", Failed: "red", Refunded: "orange" };
const METHOD_ICON = { Card: CreditCard, "Cash on Delivery": Banknote, "JazzCash / EasyPaisa": Smartphone };

function downloadCSV(rows) {
  const header = "Transaction,Order,Customer,Amount,Method,Status,Date\n";
  const body = rows.map((p) => `${p.id},${p.orderId},${p.customer},${formatPKR(p.amount)},${p.method},${p.status},${formatDate(p.date)}`).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payments.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Payments() {
  const { toast } = useToast();
  const [payments] = useState(initialPayments);

  const filterFn = (p, { search, status, method }) => {
    const matchesSearch =
      !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || p.status === status;
    const matchesMethod = !method || method === "All" || p.method === method;
    return matchesSearch && matchesStatus && matchesMethod;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(payments, { filterFn, pageSize: 8, sortFn: (a, b) => b.date - a.date });

  const totalRevenue = payments.filter((p) => p.status === "Completed").reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = payments.filter((p) => p.status === "Pending").reduce((s, p) => s + Number(p.amount), 0);
  const refunded = payments.filter((p) => p.status === "Refunded").reduce((s, p) => s + Number(p.amount), 0);

  const stats = [
    { title: "Total Revenue", value: formatPKR(totalRevenue), icon: DollarSign, color: "green" },
    { title: "Pending", value: formatPKR(pendingAmount), icon: CreditCard, color: "yellow" },
    { title: "Refunded", value: formatPKR(refunded), icon: Smartphone, color: "red" },
    { title: "Transactions", value: payments.length, icon: Banknote, color: "orange" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Payments"
        subtitle="All transactions processed through the platform."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              downloadCSV(filtered);
              toast("Export ready", { description: "payments.csv downloaded." });
            }}
          >
            <Download size={16} /> Export CSV
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search by transaction or customer..." className="sm:w-72" />
          <div className="flex gap-3">
            <Select
              value={filters.method || "All"}
              onChange={(v) => setFilter("method", v)}
              className="w-44"
              options={[
                { value: "All", label: "All Methods" },
                { value: "Card", label: "Card" },
                { value: "Cash on Delivery", label: "Cash on Delivery" },
                { value: "JazzCash / EasyPaisa", label: "JazzCash / EasyPaisa" },
              ]}
            />
            <Select
              value={filters.status || "All"}
              onChange={(v) => setFilter("status", v)}
              className="w-40"
              options={[
                { value: "All", label: "All Status" },
                { value: "Completed", label: "Completed" },
                { value: "Pending", label: "Pending" },
                { value: "Failed", label: "Failed" },
                { value: "Refunded", label: "Refunded" },
              ]}
            />
          </div>
        </div>

        {paged.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No transactions found" description="Try a different search or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-6 py-3.5 font-medium">Transaction</th>
                    <th className="px-6 py-3.5 font-medium">Order</th>
                    <th className="px-6 py-3.5 font-medium">Customer</th>
                    <th className="px-6 py-3.5 font-medium">Method</th>
                    <th className="px-6 py-3.5 font-medium">Amount</th>
                    <th className="px-6 py-3.5 font-medium">Date</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => {
                    const MethodIcon = METHOD_ICON[p.method];
                    return (
                      <tr key={p.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40">
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">{p.id}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{p.orderId}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{p.customer}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1.5">
                            <MethodIcon size={14} className="text-slate-400" /> {p.method}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(p.amount)}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-zinc-400">{formatDate(p.date)}</td>
                        <td className="px-6 py-3.5">
                          <Badge color={STATUS_COLOR[p.status]} dot>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={8} />
          </>
        )}
      </Card>
    </div>
  );
}

export default Payments;
