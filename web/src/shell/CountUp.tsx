import { useEffect, useRef, useState } from "react";

const FRAMES = 45;

/** Counts up to `target` the first time it scrolls into view. */
export function CountUp({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const nodeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        const step = Math.max(1, Math.ceil(target / FRAMES));
        let current = 0;
        const tick = () => {
          current = Math.min(target, current + step);
          setValue(current);
          if (current < target) frame = requestAnimationFrame(tick);
        };
        tick();
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return <b ref={nodeRef}>{value}</b>;
}
