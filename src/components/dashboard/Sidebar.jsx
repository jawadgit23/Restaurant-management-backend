import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Store,
  Utensils,
  Truck,
  Boxes,
  Users,
  Bike,
  CreditCard,
  Ticket,
  Star,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import BrandLogo from "../BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { isBackendConfigured } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "POS Terminal", icon: Receipt, path: "/admin/pos" },
  { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
  { label: "Branches", icon: Store, path: "/admin/branches" },
  { label: "Food Menu", icon: Utensils, path: "/admin/food" },
  { label: "Vendors", icon: Truck, path: "/admin/vendors" },
  { label: "Inventory", icon: Boxes, path: "/admin/inventory" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Delivery", icon: Bike, path: "/admin/delivery" },
  { label: "Payments", icon: CreditCard, path: "/admin/payments" },
  { label: "Coupons", icon: Ticket, path: "/admin/coupons" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
];

function Sidebar({ isOpen, setIsOpen }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const initials = isBackendConfigured && user?.email ? user.email.slice(0, 2).toUpperCase() : "JZ";

  const handleLogout = async () => {
    if (!isBackendConfigured) {
      toast("Demo mode", { type: "info", description: "Connect the backend (VITE_API_URL) to enable real sign-out." });
      return;
    }
    await signOut();
    navigate("/admin/login");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-64 flex-col
          border-r border-gray-100 bg-white
          transition-transform duration-300
          lg:translate-x-0
          dark:border-zinc-800 dark:bg-zinc-900
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Areeba<span className="text-orange-600"> Restaurant</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Admin Panel · Karachi</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            System
          </p>

          <NavLink
            to="/admin/settings"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`
            }
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3 dark:bg-zinc-800/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {isBackendConfigured && user ? "Admin" : "Admin User (Demo)"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                {isBackendConfigured && user ? user.email : "admin@areebarestaurant.pk"}
              </p>
            </div>

            <button onClick={handleLogout} className="text-slate-400 transition hover:text-red-600" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
