import { useEffect, useRef } from "react";
import type { InputHTMLAttributes } from "react";

type InlineInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  /** Called once the edit is committed (blur or Enter), not on every key. */
  onCommit: (value: string) => void;
};

/* The old panel saved a cell on the DOM "change" event, which fires when an
   edit is committed. React's onChange fires on every keystroke, so this
   listens to the native event to keep one request per edit. */
export function InlineInput({ onCommit, className = "adm-inline", ...rest }: InlineInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleChange = () => commitRef.current(input.value);
    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, []);

  return <input className={className} ref={inputRef} {...rest} />;
}
