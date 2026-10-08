import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, Sun, Moon, LogOut, Settings as SettingsIcon, User } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { isBackendConfigured } from "../../lib/apiClient";

const SEARCH_TARGETS = [
  { label: "POS Terminal", path: "/admin/pos", keywords: ["pos", "terminal", "receipt", "order", "new order"] },
  { label: "Orders", path: "/admin/orders", keywords: ["order", "orders"] },
  { label: "Branches", path: "/admin/branches", keywords: ["branch", "branches", "location"] },
  { label: "Food Menu", path: "/admin/food", keywords: ["food", "menu", "item"] },
  { label: "Vendors", path: "/admin/vendors", keywords: ["vendor", "vendors", "supplier", "suppliers"] },
  { label: "Inventory", path: "/admin/inventory", keywords: ["inventory", "stock", "ingredient", "ingredients", "supplies"] },
  { label: "Customers", path: "/admin/customers", keywords: ["customer", "customers", "user"] },
  { label: "Delivery", path: "/admin/delivery", keywords: ["delivery", "rider", "riders"] },
  { label: "Payments", path: "/admin/payments", keywords: ["payment", "payments", "transaction"] },
  { label: "Coupons", path: "/admin/coupons", keywords: ["coupon", "coupons", "discount"] },
  { label: "Reviews", path: "/admin/reviews", keywords: ["review", "reviews", "rating"] },
  { label: "Analytics", path: "/admin/analytics", keywords: ["analytics", "chart", "revenue"] },
  { label: "Settings", path: "/admin/settings", keywords: ["setting", "settings", "profile"] },
];

const NOTIFICATIONS = [
  { id: 1, title: "New order #10245 received at North Nazimabad", time: "2 min ago", unread: true },
  { id: 2, title: "Payout of Rs 124,000 processed for Nazimabad branch", time: "1 hour ago", unread: true },
  { id: 3, title: "A customer left a 2-star review at North Nazimabad", time: "3 hours ago", unread: false },
  { id: 4, title: "Coupon SAJJI20 is close to its usage limit", time: "Yesterday", unread: false },
];

function Navbar({ setIsOpen }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const initials = isBackendConfigured && user?.email ? user.email.slice(0, 2).toUpperCase() : "JZ";

  const handleLogout = async () => {
    setProfileOpen(false);
    if (!isBackendConfigured) {
      toast("Demo mode", { type: "info", description: "Connect the backend (VITE_API_URL) to enable real sign-out." });
      return;
    }
    await signOut();
    navigate("/admin/login");
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.filter((n) => n.unread).length);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const matches = SEARCH_TARGETS.filter((t) => t.keywords.some((k) => k.includes(value.toLowerCase())));
    setResults(matches);
    setShowResults(true);
  };

  const goTo = (path) => {
    navigate(path);
    setQuery("");
    setShowResults(false);
  };

  const markAllRead = () => {
    setUnread(0);
    toast("All notifications marked as read", { type: "info", duration: 1800 });
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Menu size={22} />
        </button>

        <div className="relative hidden sm:block" ref={searchRef}>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            placeholder="Search anything..."
            className="w-64 rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-900"
          />

          {showResults && (
            <div className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">No matching pages</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.path}
                    onClick={() => goTo(r.path)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Search size={14} className="text-slate-400" /> {r.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800">
          <Search size={20} />
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Bell size={21} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-orange-600 text-[9px] font-bold text-white dark:border-zinc-900">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Notifications</p>
                <button onClick={markAllRead} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-none hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-orange-600" : "bg-transparent"}`} />
                    <div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-zinc-700" />

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {isBackendConfigured && user ? user.email.split("@")[0] : "Jawad"}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Administrator</p>
            </div>
            <ChevronDown size={17} className="hidden text-slate-400 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() => {
                  navigate("/admin/settings");
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <User size={15} /> My Profile
              </button>
              <button
                onClick={() => {
                  navigate("/admin/settings");
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <SettingsIcon size={15} /> Settings
              </button>
              <div className="my-1 border-t border-slate-200 dark:border-zinc-800" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
