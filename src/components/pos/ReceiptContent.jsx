import { formatPKR } from "../../data/mockData";

/**
 * Renders the receipt body. `plain` disables dark-mode classes and forces
 * light colors — used for the print-only copy so the PDF/printout never
 * inherits the app's dark theme regardless of what's active on screen.
 */
function ReceiptContent({ receipt, plain = false }) {
  const wrapClass = plain
    ? "rounded-md border border-dashed border-slate-300 bg-white p-5 font-mono text-xs text-slate-800"
    : "rounded-md border border-dashed border-slate-300 bg-white p-5 font-mono text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
  const dividerClass = plain
    ? "my-3 border-t border-dashed border-slate-300"
    : "my-3 border-t border-dashed border-slate-300 dark:border-zinc-700";

  return (
    <div className={wrapClass}>
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-wide">AREEBA RESTAURANT</p>
        <p className="mt-0.5 text-[11px]">{receipt.branch}</p>
        <p className="text-[11px]">Karachi, Pakistan</p>
      </div>

      <div className={dividerClass} />

      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between"><span>Order #</span><span>{receipt.orderNumber}</span></div>
        <div className="flex justify-between"><span>Date</span><span>{receipt.date.toLocaleString("en-PK")}</span></div>
        <div className="flex justify-between"><span>Type</span><span>{receipt.orderType}</span></div>
        <div className="flex justify-between"><span>Customer</span><span>{receipt.customerName}</span></div>
        {receipt.customerPhone && <div className="flex justify-between"><span>Phone</span><span>{receipt.customerPhone}</span></div>}
      </div>

      <div className={dividerClass} />

      <div className="space-y-1">
        {receipt.items.map((i) => (
          <div key={i.id} className="flex justify-between text-[11px]">
            <span className="mr-2 flex-1">{i.qty} × {i.name}</span>
            <span>{formatPKR(i.qty * i.price)}</span>
          </div>
        ))}
      </div>

      <div className={dividerClass} />

      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(receipt.subtotal)}</span></div>
        {receipt.discount > 0 && (
          <div className="flex justify-between"><span>Discount ({receipt.coupon})</span><span>-{formatPKR(receipt.discount)}</span></div>
        )}
        <div className="flex justify-between"><span>Tax</span><span>{formatPKR(receipt.tax)}</span></div>
        {receipt.orderType === "Delivery" && (
          <div className="flex justify-between"><span>Delivery Fee</span><span>{receipt.deliveryFee === 0 ? "Free" : formatPKR(receipt.deliveryFee)}</span></div>
        )}
        <div className={`mt-1 flex justify-between border-t border-dashed border-slate-300 pt-1 text-sm font-extrabold ${plain ? "" : "dark:border-zinc-700"}`}>
          <span>TOTAL</span><span>{formatPKR(receipt.total)}</span>
        </div>
        <div className="flex justify-between pt-1"><span>Payment</span><span>{receipt.payment}</span></div>
      </div>

      <div className={dividerClass} />

      <p className="text-center text-[11px]">Thank you for visiting Areeba Restaurant!</p>
    </div>
  );
}

export default ReceiptContent;
