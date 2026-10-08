import { useState } from "react";
import {
  ShoppingBag,
  Search as SearchIcon,
  Eye,
  Trash2,
  Download,
  Printer,
  MapPin,
  CreditCard,
  Package,
} from "lucide-react";

import { orders as mockOrders, ORDER_STATUSES, formatDate, formatTime, formatPKR } from "../data/mockData";
import { listOrders, updateOrderStatus, deleteOrder } from "../lib/api/orders";
import { useApiData } from "../hooks/useApiData";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useToast } from "../context/ToastContext";
import PrintOrderSlip from "../components/orders/PrintOrderSlip";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";

const ALL_STATUSES = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled", "Rejected"];

// Same rules the API enforces – the UI only offers legal next steps.
const NEXT_STATUSES = {
  Pending: ["Confirmed", "Rejected", "Cancelled"],
  Confirmed: ["Preparing", "Rejected", "Cancelled"],
  Preparing: ["Ready", "Cancelled"],
  Ready: ["Out for Delivery", "Delivered", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
  Rejected: [],
};

const STATUS_COLOR = {
  Confirmed: "orange",
  Ready: "green",
  Rejected: "red",
  Delivered: "green",
  Preparing: "gray", // neutral "in progress" — orange/yellow/red/green are all already taken
  "Out for Delivery": "orange",
  Pending: "yellow",
  Cancelled: "red",
};

function downloadCSV(rows) {
  const header = "Order,Customer,Branch,Amount,Status,Date\n";
  const body = rows
    .map((o) => `${o.id},${o.customer},${o.branch},${formatPKR(o.amount)},${o.status},${formatDate(o.date)}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Orders() {
  const { toast } = useToast();
  const { data: orders, setData: setOrders, loading, usingMock } = useApiData(listOrders, mockOrders, []);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filterFn = (order, { search, status }) => {
    const matchesSearch =
      !search ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.branch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || status === "All" || order.status === status;
    return matchesSearch && matchesStatus;
  };

  const { search, setSearch, filters, setFilter, page, setPage, totalPages, filtered, paged } =
    usePaginatedList(orders, { filterFn, pageSize: 8, sortFn: (a, b) => b.date - a.date });

  const updateStatus = async (id, status) => {
    const previous = orders.find((o) => o.id === id)?.status;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setViewing((v) => (v && v.id === id ? { ...v, status } : v));
    if (!usingMock) {
      try {
        await updateOrderStatus(id, status);
      } catch (err) {
        // the server rejected it (invalid transition, no permission…) – put the old status back
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
        setViewing((v) => (v && v.id === id ? { ...v, status: previous } : v));
        toast("Couldn't update order", { type: "error", description: err.message });
        return;
      }
    }
    toast(`Order ${id} updated`, { description: `Status changed to ${status}` });
  };

  const handleDelete = async () => {
    try {
      if (!usingMock) await deleteOrder(deleting.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleting.id));
      toast("Order deleted", { type: "info", description: `${deleting.id} was removed.` });
    } catch (err) {
      toast("Couldn't delete order", { type: "error", description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const stats = [
    { title: "Total Orders", value: orders.length, icon: ShoppingBag, color: "orange" },
    { title: "Pending", value: orders.filter((o) => o.status === "Pending").length, icon: Package, color: "blue" },
    {
      title: "Delivered",
      value: orders.filter((o) => o.status === "Delivered").length,
      icon: ShoppingBag,
      color: "green",
    },
    {
      title: "Revenue",
      value: formatPKR(orders.reduce((s, o) => s + Number(o.amount), 0)),
      icon: CreditCard,
      color: "purple",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Orders"
        subtitle="Track and manage all customer orders in real time."
        actions={
          <Button variant="secondary" onClick={() => downloadCSV(filtered)}>
            <Download size={16} /> Export CSV
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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order ID, customer or branch..."
            className="sm:w-80"
          />
          <Select
            value={filters.status || "All"}
            onChange={(v) => setFilter("status", v)}
            className="sm:w-52"
            options={[{ value: "All", label: "All Statuses" }, ...(usingMock ? ORDER_STATUSES : ALL_STATUSES).map((s) => ({ value: s, label: s }))]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
          </div>
        ) : paged.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No orders found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-6 py-3.5 font-medium">Order</th>
                    <th className="px-6 py-3.5 font-medium">Customer</th>
                    <th className="px-6 py-3.5 font-medium">Branch</th>
                    <th className="px-6 py-3.5 font-medium">Amount</th>
                    <th className="px-6 py-3.5 font-medium">Date</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                        {order.id}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{order.customer}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-zinc-400">{order.branch}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                        {formatPKR(order.amount)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-zinc-400">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge color={STATUS_COLOR[order.status]} dot>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(order)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(order)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setViewing(order)}
                  className="w-full rounded-lg border border-slate-200 p-4 text-left dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">{order.id}</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(order.amount)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{order.customer}</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-500">{order.customerPhone || "—"} · {order.branch}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge color={STATUS_COLOR[order.status]}>{order.status}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(order.date)}</span>
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={filtered.length}
              pageSize={8}
            />
          </>
        )}
      </Card>

      {/* Order detail modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.id}
        subtitle="Order details"
        size="lg"
      >
        {viewing && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{viewing.customer}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{viewing.customerPhone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Branch</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{viewing.branch}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Items</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{viewing.items}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{formatPKR(viewing.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payment</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{viewing.payment}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Placed</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {formatDate(viewing.date)} · {formatTime(viewing.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-zinc-800/60 dark:text-zinc-400">
              <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
              {viewing.address}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Items Ordered
                </p>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-500/50 dark:hover:text-orange-400"
                >
                  <Printer size={13} /> Print Slip
                </button>
              </div>
              {viewing.lineItems && viewing.lineItems.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {viewing.lineItems.map((li, idx) => (
                    <div key={`${li.id}-${idx}`} className="flex items-center justify-between px-3 py-2.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                          x{li.qty}
                        </span>
                        {li.name}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-zinc-100">
                        {formatPKR(li.price * li.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No item details available for this order.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {(usingMock ? ORDER_STATUSES : [viewing.status, ...(NEXT_STATUSES[viewing.status] || [])]).map((s) => (
                  <button
                    key={s}
                    onClick={() => s !== viewing.status && updateStatus(viewing.id, s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      viewing.status === s
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete order"
        description={`This will permanently remove order ${deleting?.id} from your records. This action cannot be undone.`}
        confirmLabel="Delete order"
      />

      {/* Hidden, print-only copy rendered flat under <body> — see PrintOrderSlip.jsx */}
      <PrintOrderSlip order={viewing} />
    </div>
  );
}

export default Orders;
