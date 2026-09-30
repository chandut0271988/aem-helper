import type { LogAnalysis, RequestRecord } from "./types";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const prefix =
  /^(\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})\s+\[(\d+)\]\s+(->|<-)\s+(.+)$/;

export function parseLogTimestamp(timestamp: string): number | null {
  const match =
    /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/.exec(
      timestamp,
    );
  if (!match) return null;
  const [
    ,
    day,
    month,
    year,
    hour,
    minute,
    second,
    sign,
    offsetHour,
    offsetMinute,
  ] = match;
  const monthIndex = months.indexOf(month);
  if (
    monthIndex < 0 ||
    +year < 100 ||
    +hour > 23 ||
    +minute > 59 ||
    +second > 59 ||
    +offsetHour > 23 ||
    +offsetMinute > 59
  )
    return null;
  const localMs = Date.UTC(+year, monthIndex, +day, +hour, +minute, +second);
  const date = new Date(localMs);
  if (date.getUTCDate() !== +day || date.getUTCMonth() !== monthIndex)
    return null;
  const offset = (+offsetHour * 60 + +offsetMinute) * 60_000;
  return localMs - (sign === "+" ? offset : -offset);
}

/** One parser per log file. Pending requests are matched by the bracketed ID. */
export class RequestLogParser {
  private pending = new Map<string, RequestRecord>();
  private ambiguous = new Set<string>();
  private result: LogAnalysis = {
    requests: [],
    totalLines: 0,
    ignoredLines: 0,
    unmatchedResponses: 0,
    ambiguousIds: 0,
    normalizedQuotes: 0,
    issues: [],
  };

  private issue(message: string) {
    if (this.result.issues.length < 20)
      this.result.issues.push({ line: this.result.totalLines, message });
  }

  addLine(raw: string): void {
    this.result.totalLines++;
    let line = raw.trim();
    if (!line) return;
    // Some exported logs have a stray quote after HTTP/x or the duration.
    const quoted = /(?:HTTP\/\d+(?:\.\d+)?|\d+(?:\.\d+)?ms)"$/.test(line);
    if (quoted) line = line.slice(0, -1);
    const match = prefix.exec(line);
    if (!match) {
      this.result.ignoredLines++;
      this.issue("Unrecognized log line.");
      return;
    }
    const [, timestamp, id, direction, payload] = match;
    const timestampMs = parseLogTimestamp(timestamp);
    if (timestampMs === null) {
      this.result.ignoredLines++;
      this.issue("Invalid timestamp.");
      return;
    }
    if (direction === "->") {
      const incoming = /^(\S+)\s+(\S+)\s+HTTP\/\d+(?:\.\d+)?$/.exec(payload);
      if (!incoming) {
        this.result.ignoredLines++;
        this.issue("Invalid incoming request.");
        return;
      }
      const request: RequestRecord = {
        key: `${id}:${this.result.totalLines}`,
        id,
        timestamp,
        timestampMs,
        method: incoming[1],
        url: incoming[2],
        responseTimeMs: null,
        status: null,
      };
      this.result.requests.push(request);
      if (this.pending.has(id)) {
        this.ambiguous.add(id);
        this.pending.delete(id);
        this.issue(
          `ID ${id} has overlapping incoming requests; responses will not be guessed.`,
        );
      } else if (!this.ambiguous.has(id)) this.pending.set(id, request);
    } else {
      const outgoing = /^(\d{3})\s+.+?\s+(\d+(?:\.\d+)?)ms$/.exec(payload);
      if (!outgoing || !Number.isFinite(Number(outgoing[2]))) {
        this.result.ignoredLines++;
        this.issue("Invalid response status or duration.");
        return;
      }
      const request = this.pending.get(id);
      if (!request || timestampMs < request.timestampMs) {
        this.result.unmatchedResponses++;
        this.issue(
          `Response ${id} has no unambiguous earlier incoming request.`,
        );
      } else {
        request.responseTimeMs = Number(outgoing[2]);
        request.status = Number(outgoing[1]);
        this.pending.delete(id);
      }
    }
    if (quoted) this.result.normalizedQuotes++;
  }

  finish(): LogAnalysis {
    this.result.ambiguousIds = this.ambiguous.size;
    this.result.requests.sort((a, b) => a.timestampMs - b.timestampMs);
    return this.result;
  }
}

/** Accepts arbitrary text chunks, including chunks split halfway through a line. */
export class LogTextStream {
  private parser = new RequestLogParser();
  private remainder = "";
  push(chunk: string): void {
    const lines = (this.remainder + chunk).split("\n");
    this.remainder = lines.pop() ?? "";
    for (const line of lines) this.parser.addLine(line);
  }
  finish(): LogAnalysis {
    if (this.remainder) this.parser.addLine(this.remainder);
    return this.parser.finish();
  }
}

export function parseRequestLog(text: string): LogAnalysis {
  const stream = new LogTextStream();
  stream.push(text);
  return stream.finish();
}
