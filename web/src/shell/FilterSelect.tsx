type FilterSelectProps = {
  id: string;
  value: string;
  allLabel: string;
  options: readonly string[];
  /** The text a visitor reads, when it differs from the filtered value. */
  labelOf?: (option: string) => string;
  onChange: (value: string) => void;
};

export function FilterSelect({ id, value, allLabel, options, labelOf, onChange }: FilterSelectProps) {
  return (
    <div className="sel-wrap">
      <select id={id} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {labelOf ? labelOf(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
}
