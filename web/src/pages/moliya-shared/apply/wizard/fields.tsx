import type { ReactNode } from "react";

/* The inputs are uncontrolled on purpose: the box keeps exactly what was
   typed ("1." on the way to "1.5"), while every change is written to the
   working copy in its collected form — trimmed text, a number or null. */

const REQUIRED_MARK = /\s*\*\s*$/;

/** A trailing " *" in the dictionary label becomes a styled mark, not text. */
export function FieldLabel({ text, htmlFor }: { text: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor}>
      {text.replace(REQUIRED_MARK, "")}
      {REQUIRED_MARK.test(text) && <i className="ms-req">*</i>}
    </label>
  );
}

type FieldProps = { label: string; htmlFor?: string; hint?: string | null; isWide?: boolean; children: ReactNode };

export function Field({ label, htmlFor, hint, isWide, children }: FieldProps) {
  return (
    <div className={isWide ? "mk-f wide" : "mk-f"}>
      <FieldLabel text={label} htmlFor={htmlFor} />
      {children}
      {hint && <span className="ms-hint">{hint}</span>}
    </div>
  );
}

type TextProps = { id: string; value: string; onValue: (value: string) => void };

export function TextInput({ id, value, onValue }: TextProps) {
  return <input id={id} type="text" className="ms-in" defaultValue={value} onChange={event => onValue(event.target.value.trim())} />;
}

export function TextArea({ id, value, onValue }: TextProps) {
  return <textarea id={id} rows={2} className="ms-in" defaultValue={value} onChange={event => onValue(event.target.value.trim())} />;
}

export const parseNumber = (raw: string): number | null => (raw === "" ? null : Number(raw));

type NumberProps = { id: string; value: number | null; step?: string; onValue: (value: number | null) => void };

export function NumberInput({ id, value, step = "any", onValue }: NumberProps) {
  return (
    <input
      id={id}
      type="number"
      step={step}
      className="ms-in num"
      defaultValue={value ?? ""}
      onChange={event => onValue(parseNumber(event.target.value))}
    />
  );
}

export interface Option {
  value: string;
  label: string;
}

type SelectProps = { id: string; value: string; options: readonly Option[]; onValue: (value: string) => void };

export function Select({ id, value, options, onValue }: SelectProps) {
  return (
    <select id={id} className="ms-in" value={value} onChange={event => onValue(event.target.value)}>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

type CheckProps = { id: string; label: string; isOn: boolean; onValue: (isOn: boolean) => void };

export function Check({ id, label, isOn, onValue }: CheckProps) {
  return (
    <label className="ms-check">
      <input id={id} type="checkbox" checked={isOn} onChange={event => onValue(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="ms-sec">
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
    </div>
  );
}

/* A numeric matrix: the scrolling shell takes the border and the radius, or
   the rounded corner would clip the table inside it. */
export function Matrix({ columns, children }: { columns: readonly string[]; children: ReactNode }) {
  return (
    <div className="ms-matrixwrap">
      <table className="ms-matrix">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

type CellProps = { name: string; address: string; value: number | null; label: string; onValue: (value: number | null) => void };

/** One matrix cell; `name` is the data attribute the old sheet styles by. */
export function Cell({ name, address, value, label, onValue }: CellProps) {
  return (
    <input
      {...{ [name]: address }}
      type="number"
      className="num"
      aria-label={label}
      defaultValue={value ?? ""}
      onChange={event => onValue(parseNumber(event.target.value))}
    />
  );
}
