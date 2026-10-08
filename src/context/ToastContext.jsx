import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: "border-green-200 bg-white text-green-700 dark:border-green-900/50 dark:bg-zinc-900 dark:text-green-400",
  error: "border-red-200 bg-white text-red-700 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400",
  info: "border-orange-200 bg-white text-orange-700 dark:border-orange-900/50 dark:bg-zinc-900 dark:text-orange-400",
  warning: "border-amber-200 bg-white text-amber-700 dark:border-amber-900/50 dark:bg-zinc-900 dark:text-amber-400",
};

const ICON_COLOR = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-orange-500",
  warning: "text-amber-500",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = ++idRef.current;
      const type = opts.type || "success";
      const duration = opts.duration ?? 3200;
      setToasts((t) => [...t, { id, message, type, description: opts.description }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${STYLES[t.type]}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${ICON_COLOR[t.type]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.message}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
