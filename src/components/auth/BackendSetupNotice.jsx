import { AlertTriangle } from "lucide-react";

function BackendSetupNotice({ className = "" }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 ${className}`}>
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Backend isn't connected yet — showing demo data</p>
        <p className="mt-1 text-amber-700 dark:text-amber-400">
          Copy <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">.env.example</code> to{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">.env</code>, set{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">VITE_API_URL</code>, start the API in{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">/backend</code> and run{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">npm run seed</code> — see the README for the full walkthrough.
        </p>
      </div>
    </div>
  );
}

export default BackendSetupNotice;
