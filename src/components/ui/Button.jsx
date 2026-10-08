const VARIANTS = {
  primary:
    "bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-600/20 focus-visible:outline-orange-600",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 focus-visible:outline-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 focus-visible:outline-slate-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 focus-visible:outline-red-600",
  dangerGhost:
    "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 focus-visible:outline-red-600",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-sm gap-2",
  icon: "p-2.5",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
