import { TrendingDown, TrendingUp } from "lucide-react";

// Design system is limited to 5 brand colors (orange, white, green, red,
// yellow) plus neutral gray. "blue" and "purple" keys are kept so existing
// callers don't need to change, but they now render as red/yellow so the
// whole app stays within the approved palette.
const COLOR_MAP = {
  orange: "bg-orange-600",
  green: "bg-emerald-600",
  yellow: "bg-amber-500",
  blue: "bg-red-600",
  purple: "bg-amber-500",
  red: "bg-red-600",
};

function StatCard({ title, value, change, icon: Icon, positive = true, color = "orange" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${COLOR_MAP[color]}`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>

        {change && (
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {change}
          </span>
        )}
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500 dark:text-zinc-400">{title}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{value}</h2>
    </div>
  );
}

export default StatCard;
