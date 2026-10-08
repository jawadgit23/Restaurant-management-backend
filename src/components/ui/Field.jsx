function Field({ label, children, hint, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-orange-500/10";

export default Field;
