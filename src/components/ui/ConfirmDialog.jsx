import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 dark:bg-red-500/10">
          <AlertTriangle size={18} className="text-red-600" />
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-400">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
