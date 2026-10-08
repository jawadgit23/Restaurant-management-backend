import { useEffect, useRef, useState } from "react";

/**
 * Wraps children and fades/slides them into view the first time they
 * scroll into the viewport. Pass `index` to auto-stagger a grid of
 * siblings, or `delay` (ms) directly.
 */
function Reveal({ children, as: Tag = "div", index = 0, delay, className = "", once = true, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const staggerMs = delay ?? Math.min(index, 8) * 70;

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${staggerMs}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
