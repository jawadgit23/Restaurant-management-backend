// Vendors & Inventory aren't part of the REST API yet (the spec doesn't cover them), so when the backend is
// connected these two pages keep working from a browser-local collection seeded with the sample data.
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 0));

export function createLocalCollection(key, seed, prefix) {
  const read = () => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through */
    }
    return structuredClone(seed);
  };
  const write = (rows) => {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch {
      /* storage full / disabled – changes live in memory for this page view only */
    }
    return rows;
  };

  return {
    list: () => delay(read()),
    create: async (item) => {
      const row = { ...item, id: item.id || `${prefix}-${Date.now().toString().slice(-6)}` };
      write([...read(), row]);
      return row;
    },
    update: async (id, updates) => {
      let updated;
      write(read().map((r) => (r.id === id ? (updated = { ...r, ...updates, id }) : r)));
      return updated;
    },
    remove: async (id) => {
      write(read().filter((r) => r.id !== id));
    },
  };
}
