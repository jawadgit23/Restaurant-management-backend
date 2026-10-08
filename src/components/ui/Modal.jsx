import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />
      <div
        className={`animate-modal-in relative w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
