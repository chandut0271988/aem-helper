import { useEffect, useState } from "preact/hooks";
import { copyToClipboard } from "../utils/clipboard";
import { Icon } from "./Icon";
import { ErrorMessage } from "./ErrorMessage";
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setCopied(false);
    setError("");
  }, [value]);
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  async function copy() {
    setError("");
    try {
      await copyToClipboard(value);
      setCopied(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to copy.");
    }
  }
  return (
    <div class="copy-control">
      <button
        type="button"
        class="button button-small"
        onClick={copy}
        disabled={!value}
      >
        <Icon name={copied ? "check" : "copy"} size={15} />
        <span aria-live="polite">{copied ? "Copied" : label}</span>
      </button>
      <ErrorMessage message={error} />
    </div>
  );
}
