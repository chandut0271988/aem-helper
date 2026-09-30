export interface RequestRecord {
  key: string;
  id: string;
  timestamp: string;
  timestampMs: number;
  method: string;
  url: string;
  responseTimeMs: number | null;
  status: number | null;
}

export interface ParseIssue {
  line: number;
  message: string;
}

export interface LogAnalysis {
  requests: RequestRecord[];
  totalLines: number;
  ignoredLines: number;
  unmatchedResponses: number;
  ambiguousIds: number;
  normalizedQuotes: number;
  issues: ParseIssue[];
}

export type WorkerMessage =
  | { type: "progress"; percent: number }
  | { type: "done"; analysis: LogAnalysis }
  | { type: "error"; message: string };

export interface TimeBucket {
  startMs: number;
  hits: number;
  completed: number;
  totalResponseMs: number;
  maxResponseMs: number | null;
  averageResponseMs: number | null;
}

export interface Timeline {
  buckets: TimeBucket[];
  intervalMs: number;
}
