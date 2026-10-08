import { Search, X } from "lucide-react";

function SearchInput({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-orange-500/10"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
