import { api, fetchAll, tokenStore } from "../apiClient";

// Dashboard "Branch" == backend "Restaurant"
const STATUS_TO_LABEL = { active: "Active", under_renovation: "Under Renovation", closed: "Closed" };
const LABEL_TO_STATUS = { Active: "active", "Under Renovation": "under_renovation", Closed: "closed" };

function fromRow(r) {
  let status = STATUS_TO_LABEL[r.status] || "Active";
  if (!r.isActive && status === "Active") status = "Closed";
  return {
    id: r.id,
    name: r.name,
    manager: r.manager || "",
    address: r.address,
    phone: r.phone || "",
    area: r.area || r.city,
    city: r.city,
    status,
    isOpen: r.isOpen,
    rating: Number(r.rating || 0).toFixed(1),
    orders: r.stats?.orders ?? 0, // last 30 days
    monthlyRevenue: r.stats?.revenue ?? 0, // delivered orders, last 30 days
    opened: r.openedOn || "",
  };
}

function toBody(branch, { creating = false } = {}) {
  const status = LABEL_TO_STATUS[branch.status] || "active";
  const body = {
    name: branch.name,
    manager: branch.manager || "",
    address: branch.address,
    phone: branch.phone || undefined,
    area: branch.area || "",
    status,
    // Closed / renovating branches stop taking orders. (Fully deactivating is a super-admin action.)
    isOpen: status === "active",
  };
  if (creating) {
    body.city = branch.city || "Karachi";
    body.openedOn = branch.opened || "";
  }
  if (tokenStore.getUser()?.role === "admin") body.isActive = status === "active";
  return body;
}

/** Admin view: restaurants the signed-in staff member manages (with 30-day stats). */
export async function listBranches() {
  return (await fetchAll("/admin/restaurants")).map(fromRow);
}

/** Public view: every active restaurant (customer site). */
export async function listPublicBranches() {
  return (await fetchAll("/restaurants", { sort: "name" })).map(fromRow);
}

export async function createBranch(branch) {
  const res = await api.post("/restaurants", toBody(branch, { creating: true }));
  return fromRow(res.data);
}

export async function updateBranch(id, updates) {
  const res = await api.patch(`/restaurants/${id}`, toBody(updates));
  return fromRow({ ...res.data });
}

export async function deleteBranch(id) {
  await api.delete(`/restaurants/${id}`); // soft delete (deactivation) on the server
}
