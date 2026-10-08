function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
          <Icon size={24} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
