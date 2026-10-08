import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, DollarSign, Users, Bike, ArrowUpRight, Download, Receipt } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { weeklyRevenue, monthlyRevenue, orders, foodItems, formatDate, formatPKR } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";

const STATUS_COLOR = {
  Delivered: "green",
  Preparing: "gray", // neutral "in progress" — orange/yellow/red/green are all already taken
  "Out for Delivery": "orange",
  Pending: "yellow",
  Cancelled: "red",
};

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [range, setRange] = useState("week");

  const revenueData = range === "week" ? weeklyRevenue : monthlyRevenue;
  const recentOrders = [...orders].sort((a, b) => b.date - a.date).slice(0, 4);
  const popularFoods = [...foodItems].sort((a, b) => b.orders - a.orders).slice(0, 4);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.amount), 0);
  const activeDeliveries = orders.filter((o) => o.status === "Out for Delivery").length;

  const stats = [
    { title: "Total Revenue", value: formatPKR(totalRevenue), change: "+12.5%", icon: DollarSign, color: "green" },
    { title: "Total Orders", value: orders.length.toLocaleString(), change: "+8.2%", icon: ShoppingBag, color: "orange" },
    { title: "Customers", value: "3,214", change: "+15.3%", icon: Users, color: "blue" },
    { title: "Active Delivery", value: activeDeliveries, change: "+4.8%", icon: Bike, color: "purple" },
  ];

  const gridColor = theme === "dark" ? "#27272a" : "#f3f4f6";
  const textColor = theme === "dark" ? "#a1a1aa" : "#6b7280";
  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#18181b" : "#fff",
    border: `1px solid ${theme === "dark" ? "#27272a" : "#f3f4f6"}`,
    borderRadius: 8,
    fontSize: 13,
  };

  const downloadReport = () => {
    const header = "Order,Customer,Branch,Amount,Status,Date\n";
    const body = orders.map((o) => `${o.id},${o.customer},${o.branch},${formatPKR(o.amount)},${o.status},${formatDate(o.date)}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Report downloaded", { description: "dashboard-report.csv saved to your device." });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/admin/pos")}>
            <Receipt size={16} /> New Order (POS)
          </Button>
          <Button onClick={downloadReport}>
            <Download size={16} /> Download Report
          </Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Revenue Overview</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Revenue generated over time</p>
            </div>

            <Select
              value={range}
              onChange={setRange}
              className="w-36"
              options={[
                { value: "week", label: "This Week" },
                { value: "month", label: "This Year" },
              ]}
            />
          </div>

          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8491D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E8491D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#E8491D" fill="url(#dashRevGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Popular Foods</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Most ordered items</p>
            </div>

            <button onClick={() => navigate("/admin/food")} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              View All
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {popularFoods.map((food) => (
              <div key={food.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-800">
                  <img src={food.photo} alt={food.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{food.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{food.orders} orders</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(food.price)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Recent Orders</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Latest orders from customers</p>
          </div>

          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            View All
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate("/admin/orders")}
                  className="cursor-pointer border-b border-slate-100 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-zinc-100">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-400">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-400">{order.branch}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(order.amount)}</td>
                  <td className="px-6 py-4">
                    <Badge color={STATUS_COLOR[order.status]}>{order.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {recentOrders.map((order) => (
            <div key={order.id} className="rounded-lg border border-slate-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{order.id}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{formatPKR(order.amount)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{order.customer}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-500">{order.branch}</p>
              <span className="mt-3 inline-block">
                <Badge color={STATUS_COLOR[order.status]}>{order.status}</Badge>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
