import type { JSX } from "preact";
import { useId } from "preact/hooks";
type Props = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> & { label: string; hint?: string; onValue: (value: string) => void };
export function TextArea({ label, hint, onValue, ...props }: Props) {
  const id = useId();
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <textarea
        {...props}
        id={id}
        spellcheck={false}
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
