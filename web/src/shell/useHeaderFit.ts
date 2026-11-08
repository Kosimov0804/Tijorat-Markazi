import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const NARROW_QUERY = "(max-width:950px)";

export const isNarrowViewport = (): boolean => window.matchMedia(NARROW_QUERY).matches;

interface HeaderFit {
  headerInnerRef: RefObject<HTMLDivElement | null>;
  /** Whether this render draws the burger layout. */
  isCollapsed: boolean;
  /** The last settled answer, unaffected by a measuring pass in progress. */
  isBarCollapsed: boolean;
  /** Links overflowed the bar at a width the media query calls wide. */
  isCompact: boolean;
}

/**
 * A media query guesses whether the bar fits; this measures, so it survives
 * longer Russian labels, browser zoom and a session's extra action button.
 * `remeasureKey` should change whenever the labels or buttons do.
 */
export function useHeaderFit(remeasureKey: string): HeaderFit {
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport);
  const [isCompact, setIsCompact] = useState(false);

  /* Measuring always renders the same configuration: bar expanded, buttons in
     the bar. Measuring wherever the buttons happened to sit made the answer
     depend on the previous answer, and the header strobed. Layout effects
     flush before paint, so this pass is never visible. */
  const [isMeasuring, setIsMeasuring] = useState(true);

  useLayoutEffect(() => {
    setIsMeasuring(true);
  }, [remeasureKey, isNarrow]);

  useLayoutEffect(() => {
    if (!isMeasuring) return;
    const inner = headerInnerRef.current;
    if (inner && !isNarrow) setIsCompact(inner.scrollWidth > inner.clientWidth + 1);
    setIsMeasuring(false);
  }, [isMeasuring, isNarrow]);

  const frame = useRef(0);
  const scheduleMeasure = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setIsNarrow(isNarrowViewport());
      setIsMeasuring(true);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);
    /* Webfonts land after first paint and shift the measurement. */
    document.fonts?.ready.then(scheduleMeasure).catch(() => undefined);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [scheduleMeasure]);

  return {
    headerInnerRef,
    isCollapsed: isNarrow || (!isMeasuring && isCompact),
    isBarCollapsed: isNarrow || isCompact,
    isCompact: !isMeasuring && isCompact,
  };
}
