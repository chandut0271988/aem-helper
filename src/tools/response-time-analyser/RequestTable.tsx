import { useState } from "preact/hooks";
import { formatMs, formatUtc } from "./analysis";
import type { RequestRecord } from "./types";

export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div class="log-pagination">
      <span>
        {total
          ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total.toLocaleString()}`
          : "0 results"}
      </span>
      <div>
        <button
          type="button"
          class="button button-small"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          class="button button-small"
          disabled={page + 1 >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function RequestTable({
  requests,
  label,
}: {
  requests: RequestRecord[];
  label: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(requests.length / pageSize) - 1),
  );
  if (!requests.length)
    return <p class="log-empty">No matching requests in this section.</p>;
  return (
    <>
      <div
        class="log-table-scroll"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        <table class="log-table">
          <caption class="sr-only">
            {label}. Timestamp is the incoming request time, including its
            recorded timezone.
          </caption>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">URL</th>
              <th scope="col">Response time</th>
            </tr>
          </thead>
          <tbody>
            {requests
              .slice(current * pageSize, (current + 1) * pageSize)
              .map((request) => (
                <tr key={request.key}>
                  <td class="log-timestamp">
                    <time
                      dateTime={new Date(request.timestampMs).toISOString()}
                    >
                      {request.timestamp}
                    </time>
                    <small>
                      ID {request.id} · {request.method}
                      {request.status !== null ? ` · ${request.status}` : ""}
                    </small>
                  </td>
                  <td class="log-url">{request.url}</td>
                  <td class="log-duration">
                    {request.responseTimeMs === null ? (
                      <span class="log-muted">No response</span>
                    ) : (
                      formatMs(request.responseTimeMs)
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={current}
        total={requests.length}
        pageSize={pageSize}
        onPage={setPage}
      />
    </>
  );
}

export function HitTable({
  rows,
}: {
  rows: { url: string; hits: number; first: number; last: number }[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  );
  if (!rows.length)
    return <p class="log-empty">No incoming requests in this interval.</p>;
  return (
    <>
      <div
        class="log-table-scroll"
        role="region"
        aria-label="URL hits"
        tabIndex={0}
      >
        <table class="log-table">
          <caption class="sr-only">
            URL hit counts and first and last incoming timestamps in UTC, within
            the selected interval.
          </caption>
          <thead>
            <tr>
              <th scope="col">URL</th>
              <th scope="col">Hits</th>
              <th scope="col">First hit (UTC)</th>
              <th scope="col">Last hit (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .slice(current * pageSize, (current + 1) * pageSize)
              .map((row) => (
                <tr key={row.url}>
                  <td class="log-url">{row.url}</td>
                  <td class="log-duration">{row.hits.toLocaleString()}</td>
                  <td class="log-timestamp">{formatUtc(row.first)}</td>
                  <td class="log-timestamp">{formatUtc(row.last)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={current}
        total={rows.length}
        pageSize={pageSize}
        onPage={setPage}
      />
    </>
  );
}
