import { useCallback, useEffect, useRef } from "react";

/** setTimeout that cannot outlive the component: everything pending is cleared on unmount. */
export function useTimers(): (run: () => void, delayMs: number) => void {
  const pending = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = pending.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return useCallback((run, delayMs) => {
    const timer = setTimeout(() => {
      pending.current.delete(timer);
      run();
    }, delayMs);
    pending.current.add(timer);
  }, []);
}
