function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
        padded ? "p-5 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
