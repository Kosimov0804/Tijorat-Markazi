/*
 * Form pieces for the market pages. Forms are uncontrolled, as the old ones
 * were, so reset() and an AI "fill the form" both work on the real fields.
 *
 *   <Field label isWide?>        one .mk-f cell
 *   <FacetSelect id value allLabel options labelOf? onChange>
 *                                a filter <select> without the .sel-wrap frame
 *   <OptionSelect name options labelOf? defaultValue?>  a form <select>
 *   formValues(form)             every named field as a string
 *   checkedValues(form, name)    the ticked values of a checkbox group
 *   fillForm(form, values)       writes truthy values into named fields;
 *                                arrays are joined with ", "
 *   CURRENCIES                   the currency list of the trade forms
 *   activateOnKey(action)        onKeyDown for a card that acts as a button
 */
import type { KeyboardEvent, ReactNode } from "react";

export const CURRENCIES = ["UZS", "USD", "EUR", "RUB", "CNY"] as const;

export function Field({ label, isWide, children }: { label: ReactNode; isWide?: boolean; children: ReactNode }) {
  return (
    <div className={isWide ? "mk-f wide" : "mk-f"}>
      <label>{label}</label>
      {children}
    </div>
  );
}

type FacetSelectProps = {
  id: string;
  value: string;
  allLabel: string;
  options: readonly string[];
  labelOf?: (option: string) => string;
  onChange: (value: string) => void;
};

export function FacetSelect({ id, value, allLabel, options, labelOf, onChange }: FacetSelectProps) {
  return (
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map(option => (
        <option key={option} value={option}>
          {labelOf ? labelOf(option) : option}
        </option>
      ))}
    </select>
  );
}

type OptionSelectProps = {
  id?: string;
  name: string;
  options: readonly string[];
  labelOf?: (option: string) => string;
  defaultValue?: string;
};

export function OptionSelect({ id, name, options, labelOf, defaultValue }: OptionSelectProps) {
  return (
    <select id={id} name={name} defaultValue={defaultValue}>
      {options.map(option => (
        <option key={option} value={option}>
          {labelOf ? labelOf(option) : option}
        </option>
      ))}
    </select>
  );
}

export function formValues(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string" && !(key in values)) values[key] = value;
  });
  return values;
}

export function checkedValues(form: HTMLFormElement, name: string): string[] {
  return [...form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
    .filter(box => box.name === name && box.checked)
    .map(box => box.value);
}

type Fillable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const isFillable = (element: unknown): element is Fillable =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement;

export function fillForm(form: HTMLFormElement, values: Readonly<Record<string, unknown>>): void {
  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (!isFillable(field)) return;
    const joined = Array.isArray(value) ? value.join(", ") : value;
    const written = typeof joined === "number" && joined ? String(joined) : joined;
    if (typeof written !== "string" || !written) return;
    /* A value the list does not offer would leave a <select> showing nothing. */
    if (field instanceof HTMLSelectElement && ![...field.options].some(option => option.value === written)) return;
    field.value = written;
  });
}

export function activateOnKey(action: () => void): (event: KeyboardEvent) => void {
  return event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    action();
  };
}
