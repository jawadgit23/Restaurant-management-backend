import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isBackendConfigured } from "../lib/apiClient";

/**
 * Deliberately minimal shell for the POS terminal — no Sidebar, so the
 * order-taking screen gets the full viewport width instead of losing 256px
 * to the dashboard nav. Just a slim top bar to get back to the dashboard
 * and toggle theme/log out, mirroring what a dedicated in-store POS app
 * would look like.
 */
function POSLayout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!isBackendConfigured) {
      toast("Demo mode", { type: "info", description: "Connect the backend (VITE_API_URL) to enable real sign-out." });
      return;
    }
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
          POS Terminal
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            title="Log out"
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default POSLayout;
