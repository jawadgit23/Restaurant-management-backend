/**
 * Seamless infinite-scroll ticker. Renders `items` twice back-to-back
 * and animates a translateX(-50%) loop so it never visibly resets.
 */
function Marquee({ items, className = "", itemClassName = "", speed = "normal" }) {
  const animClass = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`flex w-max items-center gap-8 ${animClass}`}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className={`shrink-0 whitespace-nowrap ${itemClassName}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
