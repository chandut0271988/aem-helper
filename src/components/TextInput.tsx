import type { JSX } from "preact";
import { useId } from "preact/hooks";
type Props = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  hint?: string;
  onValue: (value: string) => void;
};
export function TextInput({ label, hint, onValue, ...props }: Props) {
  const id = useId();
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onInput={(event) => onValue(event.currentTarget.value)}
      />
      {hint && (
        <span id={`${id}-hint`} class="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
