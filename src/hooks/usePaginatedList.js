import { useMemo, useState } from "react";

/**
 * Generic hook for client-side search + filter + sort + pagination.
 * `filterFn` receives (item, { search, ...filters }) and returns boolean.
 */
export function usePaginatedList(items, { filterFn, pageSize = 8, sortFn } = {}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = items;
    if (filterFn) {
      result = result.filter((item) => filterFn(item, { search, ...filters }));
    }
    if (sortFn) {
      result = [...result].sort(sortFn);
    }
    return result;
  }, [items, search, filters, filterFn, sortFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  return {
    search,
    setSearch: updateSearch,
    filters,
    setFilter: updateFilter,
    page: safePage,
    setPage,
    totalPages,
    filtered,
    paged,
  };
}
