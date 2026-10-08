import { ChevronDown } from "lucide-react";

function Select({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2.5 pl-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

export default Select;
