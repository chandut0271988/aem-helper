import { useId } from "preact/hooks";
export function Select<T extends string>({
  label,
  value,
  options,
  onValue,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onValue: (value: T) => void;
}) {
  const id = useId();
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onValue(event.currentTarget.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
