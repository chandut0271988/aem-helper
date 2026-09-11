import { useEffect, useMemo, useState } from "preact/hooks";
import type { ToolProps } from "../../app/tools";
import { ToolHeader } from "../../components/ToolHeader";
import { TextInput } from "../../components/TextInput";
import { TextArea } from "../../components/TextArea";
import { CodeOutput } from "../../components/CodeOutput";
import { DownloadButton } from "../../components/DownloadButton";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Icon } from "../../components/Icon";
import { parsePaths } from "../../utils/pathUtils";
import { downloadBlob } from "../../utils/download";
import { generateFilterXml } from "./filterXml";
import { buildPackage, packageFilename } from "./packageBuilder";
import type { PackageMetadata } from "./types";

export function PackageGenerator({ packagePaths, transferId }: ToolProps) {
  const [metadata, setMetadata] = useState<PackageMetadata>({
    name: "homepage-content",
    group: "myproject",
    version: "1.0.0",
    description: "Homepage content package",
  });
  const [pathsText, setPathsText] = useState(
    "/content/mybrand/us/en/home\n/content/mybrand/gb/en/home\n/content/mybrand/de/de/home",
  );
  const [imported, setImported] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (transferId > 0) {
      setPathsText(packagePaths.join("\n"));
      setImported(true);
      setError("");
      setSuccess("");
    }
  }, [packagePaths, transferId]);
  const parsed = useMemo(() => {
    try {
      const paths = parsePaths(pathsText);
      return {
        paths,
        xml: paths.length ? generateFilterXml(paths) : "",
        error: "",
      };
    } catch (reason) {
      return {
        paths: [],
        xml: "",
        error: reason instanceof Error ? reason.message : "Invalid paths.",
      };
    }
  }, [pathsText]);
  function updateMetadata(key: keyof PackageMetadata, value: string) {
    setMetadata((previous) => ({ ...previous, [key]: value }));
    setError("");
    setSuccess("");
  }
  async function generateZip() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const blob = await buildPackage(metadata, parsed.paths);
      const filename = packageFilename(metadata);
      downloadBlob(filename, blob);
      setSuccess(`Download started: ${filename}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to create package.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ToolHeader
        title="Package Creator"
        description="Prepare repository filters and a neatly packaged AEM skeleton."
        icon="package"
        index="03"
      />
      <div class="notice">
        <Icon name="info" size={20} />
        <div>
          <strong>A package definition, ready for your next step.</strong>
          <p>
            This tool creates an AEM package definition/skeleton. It does not
            retrieve content from an AEM repository.
          </p>
        </div>
      </div>
      {imported && (
        <div class="success-message" role="status">
          <Icon name="check" size={17} />
          {packagePaths.length} paths received from Locale Path Generator.
        </div>
      )}
      <div class="workspace-grid">
        <form
          class="panel form-panel"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void generateZip();
          }}
        >
          <div class="panel-heading">
            <h2>Package details</h2>
            <span>01 / INPUT</span>
          </div>
          <TextInput
            label="Package name"
            value={metadata.name}
            onValue={(value) => updateMetadata("name", value)}
          />
          <div class="field-row">
            <TextInput
              label="Group"
              value={metadata.group}
              onValue={(value) => updateMetadata("group", value)}
            />
            <TextInput
              label="Version"
              value={metadata.version}
              onValue={(value) => updateMetadata("version", value)}
            />
          </div>
          <TextArea
            label="Description (optional)"
            value={metadata.description}
            onValue={(value) => updateMetadata("description", value)}
            rows={2}
          />
          <div class="field-divider" />
          <TextArea
            label="Paths"
            value={pathsText}
            onValue={(value) => {
              setPathsText(value);
              setImported(false);
              setSuccess("");
              setError("");
            }}
            rows={7}
            hint="One absolute repository path per line. Duplicates and blank lines are removed."
          />
          <div class="path-count" aria-live="polite">
            {parsed.paths.length} unique{" "}
            {parsed.paths.length === 1 ? "path" : "paths"}
          </div>
          <ErrorMessage message={parsed.error || error} />
          <button
            class="button button-primary"
            type="submit"
            disabled={busy || !parsed.xml}
          >
            <Icon name="package" size={17} />
            {busy ? "Building ZIP…" : "Generate Package ZIP"}
            <Icon name="download" size={17} />
          </button>
          {success && (
            <p class="success-text" role="status">
              {success}
            </p>
          )}
        </form>
        <div class="results-column">
          <div class="results-heading">
            <h2>Package preview</h2>
            <span class="subtle-tag">LIVE PREVIEW</span>
          </div>
          {parsed.xml ? (
            <CodeOutput title="filter.xml" value={parsed.xml} language="XML">
              <DownloadButton
                filename="filter.xml"
                content={parsed.xml}
                mimeType="application/xml;charset=utf-8"
                label="Download filter.xml"
              />
            </CodeOutput>
          ) : (
            <div class="empty-output compact">
              <Icon name="package" size={30} />
              <h3>Your filter will appear here</h3>
              <p>Enter at least one valid repository path.</p>
            </div>
          )}
          <section class="package-structure">
            <div class="structure-title">
              <Icon name="package" size={18} />
              <h3>Inside your ZIP</h3>
              <span>SKELETON ONLY</span>
            </div>
            <pre>
              {
                "META-INF/\n├── MANIFEST.MF\n└── vault/\n    ├── config.xml\n    ├── filter.xml\n    └── properties.xml\njcr_root/"
              }
            </pre>
            <p>
              <Icon name="info" size={15} />
              <span>
                <code>jcr_root/</code> is empty. No pages or assets are
                included.
              </span>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
