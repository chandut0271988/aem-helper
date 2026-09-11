import { useState } from "preact/hooks";
import type { ToolProps } from "../../app/tools";
import { ToolHeader } from "../../components/ToolHeader";
import { TextInput } from "../../components/TextInput";
import { TextArea } from "../../components/TextArea";
import { ErrorMessage } from "../../components/ErrorMessage";
import { CodeOutput } from "../../components/CodeOutput";
import { CopyButton } from "../../components/CopyButton";
import { DownloadButton } from "../../components/DownloadButton";
import { Icon } from "../../components/Icon";
import {
  generateLocaleCsv,
  generateLocalePaths,
  parseLocales,
} from "./localePaths";
import type { LocalePath } from "./types";

export function LocalePathGenerator({ onSendPaths }: ToolProps) {
  const [basePath, setBasePath] = useState(
    "/content/mybrand/{country}/{language}/home",
  );
  const [locales, setLocales] = useState("us,en\ngb,en\nde,de");
  const [rows, setRows] = useState<LocalePath[]>([]);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  function generate() {
    setError("");
    try {
      setRows(generateLocalePaths(basePath, parseLocales(locales)));
      setDirty(false);
    } catch (reason) {
      setRows([]);
      setError(
        reason instanceof Error ? reason.message : "Unable to generate paths.",
      );
    }
  }
  const output = rows.map((row) => row.path).join("\n");
  return (
    <>
      <ToolHeader
        title="Locale Path Generator"
        description="One base path, expanded across all your countries and languages."
        icon="locale"
        index="02"
      />
      <div class="workspace-grid">
        <form
          class="panel form-panel"
          noValidate
          onInput={() => setDirty(true)}
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div class="panel-heading">
            <h2>Path settings</h2>
            <span>01 / INPUT</span>
          </div>
          <TextInput
            label="Base path"
            value={basePath}
            onValue={setBasePath}
            spellcheck={false}
            hint="Use {country} and {language} where locales should go."
          />
          <TextArea
            label="Locales"
            value={locales}
            onValue={setLocales}
            rows={8}
            hint="One per line: us,en or us/en. Duplicate locales are removed."
          />
          <div class="inline-note">
            <Icon name="info" size={16} />
            <span>
              Whitespace is trimmed and locale codes are converted to lowercase.
            </span>
          </div>
          <ErrorMessage message={error} />
          <button class="button button-primary" type="submit">
            <Icon name="locale" size={17} />
            Generate paths
            <Icon name="arrow" size={17} />
          </button>
        </form>
        <div class="results-column">
          <div class="results-heading">
            <h2>Generated paths</h2>
            <span class="subtle-tag">
              {rows.length && !dirty ? `${rows.length} PATHS` : "TEXT OUTPUT"}
            </span>
          </div>
          {rows.length > 0 && !dirty ? (
            <>
              <CodeOutput
                title={`${rows.length} locale paths`}
                value={output}
              />
              <div class="output-actions">
                <CopyButton value={output} label="Copy All" />
                <DownloadButton
                  filename="locale-paths.txt"
                  content={output}
                  label="Download TXT"
                />
                <DownloadButton
                  filename="locale-paths.csv"
                  content={generateLocaleCsv(rows)}
                  mimeType="text/csv;charset=utf-8"
                  label="Download CSV"
                />
              </div>
              <div class="next-step">
                <div>
                  <h3>Ready to prepare a package?</h3>
                  <p>Send these paths directly to Package Creator.</p>
                </div>
                <button
                  class="button button-primary"
                  type="button"
                  onClick={() => onSendPaths(rows.map((row) => row.path))}
                >
                  Send to Package Creator
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            </>
          ) : (
            <div class="empty-output">
              <span class="empty-icon">
                <Icon name="locale" size={30} />
              </span>
              <h3>
                {dirty && rows.length
                  ? "Path settings updated"
                  : "Every locale, in one place"}
              </h3>
              <p>
                {dirty && rows.length
                  ? "Generate again to use your latest settings."
                  : "Add a base path and your locales to create a ready-to-copy list."}
              </p>
              <span class="empty-formats">
                ONE PATH <Icon name="arrow" size={15} /> EVERY LOCALE
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
