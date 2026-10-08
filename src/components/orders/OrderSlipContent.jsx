import { formatDate, formatTime, formatPKR } from "../../data/mockData";

/**
 * Printable delivery slip for a single order — handed to the rider so they
 * (and the customer) can confirm what was ordered, for how much, and how
 * it's being paid. Mirrors the POS ReceiptContent styling AND its full
 * subtotal/discount/tax/delivery-fee breakdown, plus delivery-specific
 * fields (phone, address, signature lines) that the POS receipt doesn't need.
 */
function OrderSlipContent({ order }) {
  if (!order) return null;

  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 font-mono text-xs text-slate-800">
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-wide">AREEBA RESTAURANT</p>
        <p className="mt-0.5 text-[11px]">{order.branch}</p>
        <p className="text-[11px]">Delivery Order Slip</p>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between"><span>Order #</span><span>{order.id}</span></div>
        <div className="flex justify-between">
          <span>Placed</span><span>{formatDate(order.date)} · {formatTime(order.date)}</span>
        </div>
        <div className="flex justify-between"><span>Status</span><span>{order.status}</span></div>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between"><span>Customer</span><span>{order.customer}</span></div>
        <div className="flex justify-between"><span>Phone</span><span>{order.customerPhone || "—"}</span></div>
        <div className="mt-1">
          <p>Address</p>
          <p className="font-semibold">{order.address || "—"}</p>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-1">
        {(order.lineItems || []).map((li, idx) => (
          <div key={`${li.id}-${idx}`} className="flex justify-between text-[11px]">
            <span className="mr-2 flex-1">{li.qty} × {li.name}</span>
            <span>{formatPKR(li.price * li.qty)}</span>
          </div>
        ))}
        {(!order.lineItems || order.lineItems.length === 0) && (
          <div className="flex justify-between text-[11px]">
            <span className="mr-2 flex-1">{order.items} item(s)</span>
            <span>{formatPKR(order.amount)}</span>
          </div>
        )}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal</span><span>{formatPKR(order.subtotal ?? order.amount)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount{order.coupon ? ` (${order.coupon})` : ""}</span><span>-{formatPKR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between"><span>Tax</span><span>{formatPKR(order.tax || 0)}</span></div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span>{!order.deliveryFee ? "Free" : formatPKR(order.deliveryFee)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-dashed border-slate-300 pt-1 text-sm font-extrabold">
          <span>TOTAL</span><span>{formatPKR(order.amount)}</span>
        </div>
        <div className="flex justify-between pt-1"><span>Payment</span><span>{order.payment}</span></div>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300" />

      <div className="space-y-3 text-[11px]">
        <p>Rider Signature: _______________________</p>
        <p>Received By: _______________________</p>
      </div>

      <p className="mt-3 text-center text-[11px]">Thank you for ordering from Areeba Restaurant!</p>
    </div>
  );
}

export default OrderSlipContent;
