import { useEffect, useState } from "react";

export type ApiState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

/** Loads one same-origin JSON resource for the lifetime of the component. */
export function useApiJson<T>(url: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`${url} answered ${response.status}`);
        return response.json() as Promise<T>;
      })
      .then(data => {
        if (!controller.signal.aborted) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [url]);

  return state;
}
