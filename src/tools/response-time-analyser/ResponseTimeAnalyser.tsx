import { useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import { ToolHeader } from "../../components/ToolHeader";
import { Icon } from "../../components/Icon";
import { ErrorMessage } from "../../components/ErrorMessage";
import {
  formatMs,
  formatUtc,
  groupByResponseTime,
  responseBands,
} from "./analysis";
import { GraphView } from "./GraphView";
import { RequestTable } from "./RequestTable";
import type { LogAnalysis, WorkerMessage } from "./types";
import "./responseTime.css";

type View = "responses" | "hits" | "time";
const views: { value: View; label: string }[] = [
  { value: "responses", label: "Response time" },
  { value: "hits", label: "Graph-hits" },
  { value: "time", label: "Graph-time" },
];

export function ResponseTimeAnalyser() {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
  const [view, setView] = useState<View>("responses");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const groups = useMemo(
    () => groupByResponseTime(analysis?.requests ?? []),
    [analysis],
  );
  const completed = Object.values(groups).reduce(
    (total, group) => total + group.length,
    0,
  );
  const maxResponse = useMemo(
    () =>
      analysis?.requests.reduce(
        (max, request) => Math.max(max, request.responseTimeMs ?? 0),
        0,
      ) ?? 0,
    [analysis],
  );

  function stop() {
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
  }
  function selectFile(next: File | null) {
    stop();
    setFile(next);
    setAnalysis(null);
    setError("");
    setProgress(0);
  }
  function analyse() {
    if (!file) {
      setError("Choose an AEM request log file first.");
      return;
    }
    if (!file.size) {
      setError(
        "The selected file is empty. Choose a log containing request lines.",
      );
      return;
    }
    stop();
    setBusy(true);
    setProgress(0);
    setAnalysis(null);
    setError("");
    try {
      const next = new Worker(new URL("./logWorker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = next;
      next.onmessage = (event: MessageEvent<WorkerMessage>) => {
        if (worker.current !== next) return;
        const message = event.data;
        if (message.type === "progress") {
          setProgress(message.percent);
          return;
        }
        stop();
        if (message.type === "error") setError(message.message);
        else {
          setAnalysis(message.analysis);
          setView("responses");
        }
      };
      next.onerror = () => {
        if (worker.current === next) {
          stop();
          setError(
            "Could not analyse this file. Try a smaller log or reload the page.",
          );
        }
      };
      next.postMessage(file);
    } catch {
      stop();
      setError(
        "Your browser could not start the log analyser. Please use a browser with Web Worker support.",
      );
    }
  }

  return (
    <>
      <ToolHeader
        title="Response Time Analyser"
        description="Find slow URLs and explore request load in your AEM request logs."
        icon="chart"
        index="04"
      />
      <form
        class="panel log-upload"
        onSubmit={(event) => {
          event.preventDefault();
          analyse();
        }}
      >
        <div class="log-upload-heading">
          <span class="tool-icon">
            <Icon name="chart" size={24} />
          </span>
          <div>
            <h2>Choose a request log</h2>
            <p>
              Pair incoming and returning lines by request ID. The file stays in
              your browser.
            </p>
          </div>
        </div>
        <div class="log-upload-controls">
          <div class="field">
            <label for={inputId}>AEM request log file</label>
            <input
              id={inputId}
              type="file"
              accept=".log,.txt,text/plain"
              onChange={(event) =>
                selectFile(event.currentTarget.files?.[0] ?? null)
              }
              aria-describedby={`${inputId}-hint`}
            />
            <span id={`${inputId}-hint`} class="field-hint">
              UTF-8 text · one AEM instance per file · incoming → response in
              file order
            </span>
          </div>
          <button
            type="submit"
            class="button button-primary"
            disabled={!file || busy}
          >
            <Icon name="chart" size={17} />
            {busy ? "Analysing…" : "Analyse log"}
          </button>
          {busy && (
            <button class="button" type="button" onClick={stop}>
              Cancel
            </button>
          )}
        </div>
        {busy && (
          <div class="log-progress" role="status">
            <progress
              max={100}
              value={progress}
              aria-label="Log read progress"
            />
            <span>{progress}% read · matching requests</span>
          </div>
        )}
        <ErrorMessage message={error} />
      </form>
      {!analysis && !busy && (
        <div class="log-format panel">
          <h2>Two lines. One request.</h2>
          <pre>
            {
              "30/Sep/2026:10:03:41 +0000 [2149932] -> GET /content/site/en/home.html HTTP/1.1\n30/Sep/2026:10:03:41 +0000 [2149932] <- 200 text/html;charset=UTF-8 4ms"
            }
          </pre>
          <p>
            Match by <code>[2149932]</code>, retain the incoming timestamp and
            URL, and read the duration from <code>4ms</code>.
          </p>
        </div>
      )}
      {analysis && (
        <div class="log-results">
          <div class="log-analysis-heading">
            <div>
              <h2>{file?.name}</h2>
              <p>
                {analysis.totalLines.toLocaleString()} lines processed
                {analysis.requests.length > 0 &&
                  ` · ${formatUtc(analysis.requests[0].timestampMs)} to ${formatUtc(analysis.requests[analysis.requests.length - 1].timestampMs)}`}
              </p>
            </div>
            <span class="subtle-tag" role="status">
              ANALYSIS COMPLETE
            </span>
          </div>
          <div class="log-summary">
            <div>
              <span>Incoming requests</span>
              <strong>{analysis.requests.length.toLocaleString()}</strong>
            </div>
            <div>
              <span>Matched responses</span>
              <strong>{completed.toLocaleString()}</strong>
            </div>
            <div>
              <span>Slower than 500 ms</span>
              <strong>
                {(completed - groups.fast.length).toLocaleString()}
              </strong>
            </div>
            <div>
              <span>Longest response</span>
              <strong>{completed ? formatMs(maxResponse) : "—"}</strong>
            </div>
          </div>
          <div class="log-diagnostics">
            <p>
              {analysis.requests.length - completed} incoming without matched
              responses · {analysis.unmatchedResponses} unmatched response lines
              · {analysis.ignoredLines} ignored lines
              {analysis.ambiguousIds > 0 &&
                ` · ${analysis.ambiguousIds} ambiguous IDs`}
              {analysis.normalizedQuotes > 0 &&
                ` · ${analysis.normalizedQuotes} trailing quotes normalized`}
            </p>
            {analysis.issues.length > 0 && (
              <details>
                <summary>
                  Parsing notes (first {analysis.issues.length})
                </summary>
                <ul>
                  {analysis.issues.map((issue, index) => (
                    <li key={index}>
                      Line {issue.line}: {issue.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          {analysis.requests.length ? (
            <>
              <div
                class="log-view-switch"
                role="group"
                aria-label="Analysis view"
              >
                {views.map((item) => (
                  <button
                    class={view === item.value ? "selected" : ""}
                    aria-pressed={view === item.value}
                    onClick={() => setView(item.value)}
                    key={item.value}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {view === "responses" ? (
                <div class="log-bands">
                  <p class="log-muted">
                    Matched responses only, slowest first in each section. Exact
                    boundary values belong to the lower band. Timestamps retain
                    the log’s timezone.
                  </p>
                  {responseBands.map((band) => (
                    <section
                      class={`panel log-band log-band-${band.tone}`}
                      key={band.id}
                    >
                      <div class="log-band-heading">
                        <div>
                          <h2>{band.label}</h2>
                          <span>{band.description}</span>
                        </div>
                        <strong>
                          {groups[band.id].length.toLocaleString()} requests
                        </strong>
                      </div>
                      <RequestTable
                        requests={groups[band.id]}
                        label={`${band.label} requests`}
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <GraphView
                  key={`${file?.name}-${view}`}
                  requests={analysis.requests}
                  mode={view}
                />
              )}
            </>
          ) : (
            <div class="error-message" role="alert">
              No valid incoming requests found. Check the file format and the
              parsing notes above.
            </div>
          )}
        </div>
      )}
    </>
  );
}
