/**
 * Areeba Restaurant brand mark — a chef's hat, echoing the mascot on the
 * physical storefront signage (a chef character in a toque), simplified
 * into a clean vector mark so it stays crisp from favicon size up to a
 * large hero/login placement. Built from the same 5-color system as the
 * rest of the app: orange (brand), white (icon), yellow (accent) — no
 * other hues.
 *
 * `animated` adds a slow idle pulse to the accent button on the hat —
 * nice for the header/hero/login, skip it for favicons or dense admin chrome.
 */
function BrandLogo({ size = 40, rounded = "rounded-md", animated = false, className = "" }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${rounded} bg-gradient-to-br from-[#EF6A3A] to-[#C93C14] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width="70%" height="70%" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chef's toque */}
        <path
          d="M12 17.5c-2.2 0-4-1.8-4-4 0-1.9 1.3-3.5 3.1-3.9C11.5 7.4 13.5 6 16 6c1.4 0 2.6.5 3.6 1.3C20.5 6.5 21.7 6 23 6c2.5 0 4.5 1.5 4.9 3.6 1.8.4 3.1 2 3.1 3.9 0 2.2-1.8 4-4 4H12z"
          fill="#FFFFFF"
        />
        <rect x="11.5" y="16.5" width="17" height="6" rx="1.2" fill="#FFFFFF" />
        {/* Mustache, a nod to the mascot's face */}
        <path
          d="M13 26c1.6-1.6 3.2-1.4 4.3-.3.7.7 1.7.7 2.4 0l.3-.3.3.3c.7.7 1.7.7 2.4 0 1.1-1.1 2.7-1.3 4.3.3-1 2.6-3.6 4.3-7 4.3s-6-1.7-7-4.3z"
          fill="#FFFFFF"
        />
        {/* Accent button on the hat band */}
        <circle cx="20" cy="12" r="1.5" fill="#F5A623" className={animated ? "animate-glow-pulse" : ""} />
      </svg>
    </div>
  );
}

export default BrandLogo;
