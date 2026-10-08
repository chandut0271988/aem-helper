import { describe, expect, it } from "vitest";
import {
  buildTimeline,
  bucketRequests,
  groupByResponseTime,
  responseBand,
  responseBands,
  urlHits,
} from "./analysis";
import { LogTextStream, parseLogTimestamp, parseRequestLog } from "./logParser";
import { generateResponseText } from "./responseText";

const incoming = (
  id: number,
  time = "10:03:41",
  url = "/content/site/en/home.html",
  offset = "+0000",
) => `30/Sep/2026:${time} ${offset} [${id}] -> GET ${url} HTTP/1.1`;
const outgoing = (id: number, ms = 4, time = "10:03:41", offset = "+0000") =>
  `30/Sep/2026:${time} ${offset} [${id}] <- 200 text/html;charset=UTF-8 ${ms}ms`;
const pair = (id: number, ms = 4, time = "10:03:41", url?: string) =>
  `${incoming(id, time, url)}\n${outgoing(id, ms, time)}`;

describe("request log matching", () => {
  it("matches the requested format by identifier and retains incoming timestamp, URL and duration", () => {
    const result = parseRequestLog(
      `${incoming(2149932, "10:03:41", "/content/ams/healthcheck/regent.html")}\n${outgoing(2149932, 4, "10:03:42")}`,
    );
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]).toMatchObject({
      id: "2149932",
      timestamp: "30/Sep/2026:10:03:41 +0000",
      url: "/content/ams/healthcheck/regent.html",
      responseTimeMs: 4,
      status: 200,
      method: "GET",
    });
    expect(result.requests[0].timestampMs).toBe(
      Date.UTC(2026, 8, 30, 10, 3, 41),
    );
  });
  it("matches interleaved requests with responses in a different order", () => {
    const result = parseRequestLog(
      [incoming(1), incoming(2), outgoing(2, 80), outgoing(1, 1500)].join("\n"),
    );
    expect(
      result.requests.map((request) => [request.id, request.responseTimeMs]),
    ).toEqual([
      ["1", 1500],
      ["2", 80],
    ]);
  });
  it("tolerates the reference file's trailing quotes, whitespace, BOM, CRLF, and no final newline", () => {
    const result = parseRequestLog(
      `\ufeff  ${incoming(1)}"\r\n\r\n\t${outgoing(1)}"`,
    );
    expect(result.requests[0].responseTimeMs).toBe(4);
    expect(result.normalizedQuotes).toBe(2);
    expect(result.ignoredLines).toBe(0);
    expect(result.totalLines).toBe(3);
  });
  it("preserves encoded paths and query strings without treating URLs as markup", () => {
    const url = '/content/%E6%97%A5.json?a=1&b="quote"';
    expect(parseRequestLog(pair(1, 2, "10:03:41", url)).requests[0].url).toBe(
      url,
    );
  });
  it("supports POST, HEAD, non-200 statuses, and fractional/zero durations", () => {
    const result = parseRequestLog(
      [
        incoming(1).replace("GET", "POST"),
        outgoing(1, 0).replace("200", "500"),
        incoming(2).replace("GET", "HEAD"),
        outgoing(2, 1.5),
      ].join("\n"),
    );
    expect(
      result.requests.map((request) => [
        request.method,
        request.status,
        request.responseTimeMs,
      ]),
    ).toEqual([
      ["POST", 500, 0],
      ["HEAD", 200, 1.5],
    ]);
  });
  it("retains unfinished incoming requests and reports orphan responses", () => {
    const result = parseRequestLog([outgoing(99), incoming(1)].join("\n"));
    expect(result.unmatchedResponses).toBe(1);
    expect(result.requests[0].responseTimeMs).toBeNull();
    expect(result.issues[0].line).toBe(1);
  });
  it("does not invent a match for a response preceding its incoming line", () => {
    const result = parseRequestLog([outgoing(1), incoming(1)].join("\n"));
    expect(result.unmatchedResponses).toBe(1);
    expect(result.requests[0].responseTimeMs).toBeNull();
  });
  it("preserves distinct requests when an ID is reused after completion", () => {
    const result = parseRequestLog(
      `${pair(1, 4)}\n${pair(1, 900, "10:03:42")}`,
    );
    expect(result.requests.map((request) => request.responseTimeMs)).toEqual([
      4, 900,
    ]);
    expect(new Set(result.requests.map((request) => request.key)).size).toBe(2);
  });
  it("does not guess when an ID is reused while still pending", () => {
    const result = parseRequestLog(
      [incoming(1), incoming(1), outgoing(1), outgoing(1)].join("\n"),
    );
    expect(result.ambiguousIds).toBe(1);
    expect(result.unmatchedResponses).toBe(2);
    expect(
      result.requests.every((request) => request.responseTimeMs === null),
    ).toBe(true);
  });
  it("does not overwrite a matched response with a duplicate", () => {
    const result = parseRequestLog(`${pair(1, 4)}\n${outgoing(1, 900)}`);
    expect(result.requests[0].responseTimeMs).toBe(4);
    expect(result.unmatchedResponses).toBe(1);
  });
  it("rejects a response timestamp before its request but keeps waiting for a valid response", () => {
    const result = parseRequestLog(
      [incoming(1), outgoing(1, 12, "10:03:40"), outgoing(1, 4)].join("\n"),
    );
    expect(result.unmatchedResponses).toBe(1);
    expect(result.requests[0].responseTimeMs).toBe(4);
  });
  it("reports malformed lines without losing other requests or fabricating zero durations", () => {
    const result = parseRequestLog(
      [
        "not a log line",
        incoming(1),
        outgoing(1).replace("4ms", "-1ms"),
        incoming(2),
        outgoing(2),
      ].join("\n"),
    );
    expect(result.ignoredLines).toBe(2);
    expect(result.requests.map((request) => request.responseTimeMs)).toEqual([
      null,
      4,
    ]);
    expect(result.issues.map((issue) => issue.line)).toEqual([1, 3]);
  });
  it("caps diagnostic examples while counting all malformed lines", () => {
    const result = parseRequestLog(Array(50).fill("broken").join("\n"));
    expect(result.ignoredLines).toBe(50);
    expect(result.issues).toHaveLength(20);
  });
  it("parses arbitrary chunk boundaries identically to a whole file", () => {
    const text = `${pair(1, 0, "10:03:41", "/content/日本語")}\r\n${pair(2, 25000)}\n`;
    for (const length of [1, 3, 17, 100]) {
      const stream = new LogTextStream();
      for (let index = 0; index < text.length; index += length)
        stream.push(text.slice(index, index + length));
      expect(stream.finish()).toEqual(parseRequestLog(text));
    }
  });
  it("handles an empty file without graphs or fake data", () => {
    expect(parseRequestLog("").requests).toEqual([]);
    expect(buildTimeline([]).buckets).toEqual([]);
  });
});

describe("timestamps", () => {
  it("converts positive and negative timezone offsets to UTC", () => {
    expect(parseLogTimestamp("30/Sep/2026:15:33:41 +0530")).toBe(
      parseLogTimestamp("30/Sep/2026:10:03:41 +0000"),
    );
    expect(parseLogTimestamp("30/Sep/2026:06:03:41 -0400")).toBe(
      parseLogTimestamp("30/Sep/2026:10:03:41 +0000"),
    );
  });
  it.each([
    "31/Sep/2026:10:03:41 +0000",
    "30/Bad/2026:10:03:41 +0000",
    "30/Sep/2026:24:03:41 +0000",
    "30/Sep/2026:10:60:41 +0000",
    "30/Sep/2026:10:03:41 +0060",
    "29/Feb/2025:10:03:41 +0000",
  ])("rejects invalid timestamp %s", (timestamp) => {
    expect(parseLogTimestamp(timestamp)).toBeNull();
  });
});

describe("response bands and graphs", () => {
  it.each([
    [0, "fast"],
    [500, "fast"],
    [500.1, "moderate"],
    [5000, "moderate"],
    [5000.1, "slow"],
    [20000, "slow"],
    [20000.1, "very-slow"],
    [60000, "very-slow"],
    [60000.1, "extremely-slow"],
  ] as const)("places %s ms in %s without boundary gaps", (ms, expected) => {
    expect(responseBand(ms)).toBe(expected);
  });
  it("lists bands slowest first and places every matched request in exactly one band", () => {
    const durations = [60001, 60000, 20000, 5000, 500];
    const requests = parseRequestLog(
      durations.map((ms, index) => pair(index, ms)).join("\n"),
    ).requests;
    const groups = groupByResponseTime(requests);
    expect(
      responseBands.map((band) =>
        groups[band.id].map((request) => request.responseTimeMs),
      ),
    ).toEqual(durations.map((ms) => [ms]));
  });
  it("exports every row beyond the table page size with exact URLs and timestamps", () => {
    const requests = parseRequestLog(
      Array.from({ length: 30 }, (_, index) =>
        pair(
          index,
          60001 + index,
          "10:03:41",
          `/content/page-${index}.html?a=1&b=2`,
        ),
      ).join("\n"),
    ).requests;
    const text = generateResponseText(">60,000 ms", requests);
    expect(text).toContain("Requests: 30\n");
    expect(text).toContain("Timestamp\tURL\tResponse time (ms)\n");
    expect(text.trimEnd().split("\n")).toHaveLength(34);
    expect(text).toContain(
      "30/Sep/2026:10:03:41 +0000\t/content/page-29.html?a=1&b=2\t60030\n",
    );
    expect(generateResponseText(">60,000 ms", [])).toContain("Requests: 0\n");
  });
  it("exports missing responses with unknown duration while retaining zero-ms matches", () => {
    const requests = parseRequestLog(
      `${incoming(1)}\n${pair(2, 0)}\n${incoming(3, "10:03:42", "/content/pending.html")}`,
    ).requests;
    const missing = requests.filter(
      (request) => request.responseTimeMs === null,
    );
    expect(missing.map((request) => request.id)).toEqual(["1", "3"]);
    const text = generateResponseText("Missing responses", missing);
    expect(text).toContain("Requests: 2\n");
    expect(text).toContain(
      "30/Sep/2026:10:03:42 +0000\t/content/pending.html\tNo response\n",
    );
    expect(groupByResponseTime(requests).fast).toHaveLength(1);
  });
  it("excludes incomplete requests from bands and sorts slowest first", () => {
    const requests = parseRequestLog(
      `${pair(1, 400)}\n${pair(2, 500)}\n${pair(3, 510)}\n${incoming(4)}`,
    ).requests;
    const groups = groupByResponseTime(requests);
    expect(groups.fast.map((request) => request.responseTimeMs)).toEqual([
      500, 400,
    ]);
    expect(Object.values(groups).flat()).toHaveLength(3);
  });
  it("counts all incoming hits, including incomplete requests, and retains empty time intervals", () => {
    const requests = parseRequestLog(
      [
        pair(1, 100, "10:03:40"),
        incoming(2, "10:03:40"),
        pair(3, 300, "10:03:42"),
      ].join("\n"),
    ).requests;
    const timeline = buildTimeline(requests);
    expect(timeline.intervalMs).toBe(1000);
    expect(
      timeline.buckets.map((bucket) => [
        bucket.hits,
        bucket.completed,
        bucket.averageResponseMs,
        bucket.maxResponseMs,
      ]),
    ).toEqual([
      [2, 1, 100, 100],
      [0, 0, null, null],
      [1, 1, 300, 300],
    ]);
  });
  it("computes mean and maximum durations without disguising slow outliers", () => {
    const requests = parseRequestLog(
      [pair(1, 0), pair(2, 100), pair(3, 50000)].join("\n"),
    ).requests;
    const bucket = buildTimeline(requests).buckets[0];
    expect(bucket.averageResponseMs).toBe(16700);
    expect(bucket.maxResponseMs).toBe(50000);
    expect(bucket.hits).toBe(3);
  });
  it("keeps graphs bounded for long logs and conserves counts at bucket boundaries", () => {
    const requests = parseRequestLog(`${pair(1)}\n${pair(2)}`).requests;
    requests[1].timestampMs += 500 * 86_400_000;
    const timeline = buildTimeline(requests);
    expect(timeline.buckets.length).toBeLessThanOrEqual(120);
    expect(timeline.buckets.reduce((sum, bucket) => sum + bucket.hits, 0)).toBe(
      2,
    );
  });
  it("uses start-inclusive/end-exclusive intervals and groups exact URLs independently", () => {
    const requests = parseRequestLog(
      [
        pair(1, 5, "10:03:40", "/home?a=1"),
        pair(2, 10, "10:03:40", "/home?a=1"),
        pair(3, 15, "10:03:41", "/home?a=2"),
      ].join("\n"),
    ).requests;
    const selected = bucketRequests(requests, requests[0].timestampMs, 1000);
    expect(selected).toHaveLength(2);
    expect(urlHits(requests).map((row) => [row.url, row.hits])).toEqual([
      ["/home?a=1", 2],
      ["/home?a=2", 1],
    ]);
    expect(urlHits(selected)[0]).toMatchObject({
      hits: 2,
      first: requests[0].timestampMs,
      last: requests[1].timestampMs,
    });
  });
  it("aligns timezone-equivalent timestamps into the same bucket", () => {
    const requests = parseRequestLog(
      [
        incoming(1),
        outgoing(1),
        incoming(2, "15:33:41", "/home", "+0530"),
        outgoing(2, 6, "15:33:41", "+0530"),
      ].join("\n"),
    ).requests;
    expect(buildTimeline(requests).buckets).toHaveLength(1);
    expect(buildTimeline(requests).buckets[0].averageResponseMs).toBe(5);
  });
});
