import type { RequestRecord } from "./types";

/** Export every request in the band, independently of the table's current page. */
export function generateResponseText(
  label: string,
  requests: RequestRecord[],
): string {
  return [
    `Response time: ${label}`,
    `Requests: ${requests.length}`,
    "",
    "Timestamp\tURL\tResponse time (ms)",
    ...requests.map(
      (request) =>
        `${request.timestamp}\t${request.url}\t${request.responseTimeMs ?? "No response"}`,
    ),
    "",
  ].join("\n");
}
