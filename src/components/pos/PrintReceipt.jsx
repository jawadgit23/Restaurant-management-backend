import { createPortal } from "react-dom";
import ReceiptContent from "./ReceiptContent";

/**
 * This renders invisibly on screen (display:none) and is only revealed by
 * the print stylesheet in index.css, which hides every other direct child
 * of <body> and shows this one in normal document flow. Keeping it as a
 * flat, top-level portal — instead of reusing the copy nested inside the
 * Modal — avoids the Modal's `overflow-y-auto` / `position: relative`
 * wrapper clipping or mispositioning the receipt when printed to PDF.
 */
function PrintReceipt({ receipt }) {
  if (!receipt) return null;

  return createPortal(
    <div id="receipt-print-root">
      <ReceiptContent receipt={receipt} plain />
    </div>,
    document.body
  );
}

export default PrintReceipt;
