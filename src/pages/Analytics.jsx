import { useState } from "react";
import { DollarSign, ShoppingBag, Users, TrendingUp, Download } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { weeklyRevenue, monthlyRevenue, categorySales, branchDistribution, formatPKR } from "../data/mockData";
import { useTheme } from "../context/ThemeContext";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

function Analytics() {
  const [range, setRange] = useState("week");
  const { theme } = useTheme();
  const data = range === "week" ? weeklyRevenue : monthlyRevenue;

  const gridColor = theme === "dark" ? "#27272a" : "#f3f4f6";
  const textColor = theme === "dark" ? "#a1a1aa" : "#6b7280";
  const tooltipStyle = {
    backgroundColor: theme === "dark" ? "#18181b" : "#fff",
    border: `1px solid ${theme === "dark" ? "#27272a" : "#f3f4f6"}`,
    borderRadius: 8,
    fontSize: 13,
  };

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = (totalRevenue / totalOrders).toFixed(2);

  const stats = [
    { title: "Total Revenue", value: formatPKR(totalRevenue), change: "+12.4%", icon: DollarSign, color: "green" },
    { title: "Total Orders", value: totalOrders.toLocaleString(), change: "+8.1%", icon: ShoppingBag, color: "orange" },
    { title: "Avg. Order Value", value: formatPKR(avgOrderValue), change: "+3.6%", icon: TrendingUp, color: "blue" },
    { title: "New Customers", value: "428", change: "+15.9%", icon: Users, color: "purple" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into performance across the platform."
        actions={
          <>
            <Select
              value={range}
              onChange={setRange}
              className="w-40"
              options={[
                { value: "week", label: "Last 7 days" },
                { value: "month", label: "Last 8 months" },
              ]}
            />
            <Button variant="secondary">
              <Download size={16} /> Export
            </Button>
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} change={s.change} icon={s.icon} color={s.color} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Revenue & Orders</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Trend over the selected period</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8491D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E8491D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#E8491D" fill="url(#revGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Category Share</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Orders by food category</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySales} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {categorySales.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {categorySales.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-slate-600 dark:text-zinc-400">{c.name}</span>
                <span className="ml-auto font-medium text-slate-900 dark:text-zinc-100">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Orders by Branch</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Geographic distribution</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchDistribution} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis type="category" dataKey="branch" axisLine={false} tickLine={false} width={90} tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#E8491D" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Order Volume</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Number of orders over time</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#fdba74" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;
