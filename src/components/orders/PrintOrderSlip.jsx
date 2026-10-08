import { createPortal } from "react-dom";
import OrderSlipContent from "./OrderSlipContent";

/**
 * Same pattern as PrintReceipt (POS): renders invisibly on screen and is
 * only revealed by the print stylesheet in index.css, which hides every
 * other direct child of <body> and shows this one. Kept as a flat,
 * top-level portal so the modal's overflow/scroll wrapper never clips or
 * mispositions the slip when printed.
 */
function PrintOrderSlip({ order }) {
  if (!order) return null;

  return createPortal(
    <div id="order-slip-print-root">
      <OrderSlipContent order={order} />
    </div>,
    document.body
  );
}

export default PrintOrderSlip;
