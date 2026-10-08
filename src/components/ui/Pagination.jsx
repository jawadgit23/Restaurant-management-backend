import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, onChange, totalItems, pageSize }) {
  if (totalPages <= 0) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = [];
  const windowSize = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - windowSize && i <= page + windowSize)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row dark:border-zinc-800">
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Showing <span className="font-semibold text-slate-700 dark:text-zinc-300">{start}-{end}</span> of{" "}
        <span className="font-semibold text-slate-700 dark:text-zinc-300">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`h-8 w-8 rounded-md text-sm font-semibold transition ${
                p === page
                  ? "bg-orange-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
