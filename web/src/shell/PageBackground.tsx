import { useEffect, useRef } from "react";
import { kgMonumentBackground } from "@legacy/monument-bg.js";
import { kgSkyline } from "@legacy/skyline.js";

/* A monument photograph wins if one exists; the drawn skyline is the fallback.
   Both painters write straight into the mount and React never touches it. */
export function PageBackground({ isPainted = true }: { isPainted?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hasBooted = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!isPainted || !mount || hasBooted.current) return;
    hasBooted.current = true;
    kgMonumentBackground(mount)
      .then(source => {
        if (!source) kgSkyline(mount);
      })
      .catch(() => kgSkyline(mount));
  }, [isPainted]);

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <div className="skyline" id="skyline" aria-hidden="true" ref={mountRef} />
    </>
  );
}
