import type { RequestRecord, Timeline, TimeBucket } from "./types";

export const responseBands = [
  { id: "fast", label: "≤500 ms", description: "Up to 500 ms", tone: "green" },
  {
    id: "moderate",
    label: ">500–5,000 ms",
    description: "Over 500, up to 5,000 ms",
    tone: "blue",
  },
  {
    id: "slow",
    label: ">5,000–20,000 ms",
    description: "Over 5,000, up to 20,000 ms",
    tone: "amber",
  },
  {
    id: "very-slow",
    label: ">20,000 ms",
    description: "Over 20,000 ms",
    tone: "red",
  },
] as const;
export type ResponseBand = (typeof responseBands)[number]["id"];

export function responseBand(ms: number): ResponseBand {
  if (ms <= 500) return "fast";
  if (ms <= 5_000) return "moderate";
  if (ms <= 20_000) return "slow";
  return "very-slow";
}

export function groupByResponseTime(
  requests: RequestRecord[],
): Record<ResponseBand, RequestRecord[]> {
  const groups: Record<ResponseBand, RequestRecord[]> = {
    fast: [],
    moderate: [],
    slow: [],
    "very-slow": [],
  };
  for (const request of requests)
    if (request.responseTimeMs !== null)
      groups[responseBand(request.responseTimeMs)].push(request);
  for (const group of Object.values(groups))
    group.sort(
      (a, b) =>
        b.responseTimeMs! - a.responseTimeMs! || a.timestampMs - b.timestampMs,
    );
  return groups;
}

const intervals = [
  1_000, 5_000, 10_000, 30_000, 60_000, 300_000, 900_000, 3_600_000, 21_600_000,
  86_400_000,
];

export function buildTimeline(requests: RequestRecord[]): Timeline {
  if (!requests.length) return { buckets: [], intervalMs: 1_000 };
  let min = Infinity,
    max = -Infinity;
  for (const request of requests) {
    min = Math.min(min, request.timestampMs);
    max = Math.max(max, request.timestampMs);
  }
  // Bound SVG work and include empty intervals so quiet periods remain visible.
  const count = (interval: number) =>
    Math.floor(max / interval) - Math.floor(min / interval) + 1;
  const intervalMs =
    intervals.find((interval) => count(interval) <= 120) ??
    Math.ceil((max - min + 1) / 119 / 86_400_000) * 86_400_000;
  const start = Math.floor(min / intervalMs) * intervalMs;
  const buckets: TimeBucket[] = Array.from(
    { length: count(intervalMs) },
    (_, index) => ({
      startMs: start + index * intervalMs,
      hits: 0,
      completed: 0,
      totalResponseMs: 0,
      averageResponseMs: null,
      maxResponseMs: null,
    }),
  );
  for (const request of requests) {
    const bucket =
      buckets[Math.floor((request.timestampMs - start) / intervalMs)];
    bucket.hits++;
    if (request.responseTimeMs !== null) {
      bucket.completed++;
      bucket.totalResponseMs += request.responseTimeMs;
      bucket.maxResponseMs = Math.max(
        bucket.maxResponseMs ?? 0,
        request.responseTimeMs,
      );
    }
  }
  for (const bucket of buckets)
    if (bucket.completed)
      bucket.averageResponseMs = bucket.totalResponseMs / bucket.completed;
  return { buckets, intervalMs };
}

export function bucketRequests(
  requests: RequestRecord[],
  start: number,
  intervalMs: number,
): RequestRecord[] {
  return requests.filter(
    (request) =>
      request.timestampMs >= start && request.timestampMs < start + intervalMs,
  );
}

export function urlHits(requests: RequestRecord[]) {
  const groups = new Map<
    string,
    { url: string; hits: number; first: number; last: number }
  >();
  for (const request of requests) {
    const row = groups.get(request.url);
    if (row) {
      row.hits++;
      row.first = Math.min(row.first, request.timestampMs);
      row.last = Math.max(row.last, request.timestampMs);
    } else
      groups.set(request.url, {
        url: request.url,
        hits: 1,
        first: request.timestampMs,
        last: request.timestampMs,
      });
  }
  return [...groups.values()].sort(
    (a, b) => b.hits - a.hits || a.url.localeCompare(b.url),
  );
}

export function formatUtc(time: number): string {
  return new Date(time)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");
}
export function formatInterval(ms: number): string {
  if (ms < 60_000) return `${ms / 1_000} second${ms === 1_000 ? "" : "s"}`;
  if (ms < 3_600_000) return `${ms / 60_000} minute${ms === 60_000 ? "" : "s"}`;
  if (ms < 86_400_000)
    return `${ms / 3_600_000} hour${ms === 3_600_000 ? "" : "s"}`;
  return `${ms / 86_400_000} day${ms === 86_400_000 ? "" : "s"}`;
}

export function formatMs(ms: number): string {
  return `${ms.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`;
}
