// Design system is limited to 5 brand colors (orange, white, green, red,
// yellow) plus neutral gray. "blue" and "purple" keys are kept so existing
// callers don't need to change, but they now render as red/yellow so the
// whole app stays within the approved palette.
const COLOR_MAP = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  yellow: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  blue: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  gray: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  purple: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
};

const DOT_MAP = {
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-500",
  blue: "bg-red-500",
  orange: "bg-orange-500",
  gray: "bg-slate-500",
  purple: "bg-amber-500",
};

function Badge({ color = "gray", children, dot = false, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-tight whitespace-nowrap ${COLOR_MAP[color]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_MAP[color]}`} />}
      {children}
    </span>
  );
}

export default Badge;
