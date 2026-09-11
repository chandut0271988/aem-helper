import type { ComponentChildren } from "preact";
import { CopyButton } from "./CopyButton";
export function CodeOutput({
  title,
  value,
  language,
  children,
}: {
  title: string;
  value: string;
  language?: string;
  children?: ComponentChildren;
}) {
  return (
    <section class="code-output" aria-label={title}>
      <div class="code-toolbar">
        <div class="code-title">
          <h3>{title}</h3>
          {language && <span>{language}</span>}
        </div>
        <CopyButton value={value} />
      </div>
      <pre tabIndex={0}>
        <code>{value}</code>
      </pre>
      {children && <div class="code-footer">{children}</div>}
    </section>
  );
}
