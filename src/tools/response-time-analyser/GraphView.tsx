import { useMemo, useState } from "preact/hooks";
import { Select } from "../../components/Select";
import {
  bucketRequests,
  buildTimeline,
  formatInterval,
  formatMs,
  formatUtc,
  urlHits,
} from "./analysis";
import { HitTable, RequestTable } from "./RequestTable";
import { TimelineChart } from "./TimelineChart";
import type { RequestRecord } from "./types";

export function GraphView({
  requests,
  mode,
}: {
  requests: RequestRecord[];
  mode: "hits" | "time";
}) {
  const [selected, setSelected] = useState("all");
  const timeline = useMemo(() => buildTimeline(requests), [requests]);
  const bucket =
    selected === "all" ? undefined : timeline.buckets[Number(selected)];
  const visible = useMemo(
    () =>
      bucket
        ? bucketRequests(requests, bucket.startMs, timeline.intervalMs)
        : requests,
    [requests, bucket, timeline.intervalMs],
  );
  const matched = useMemo(
    () => visible.filter((request) => request.responseTimeMs !== null),
    [visible],
  );
  const hits = useMemo(() => urlHits(visible), [visible]);
  const options = [
    { value: "all", label: "All intervals" },
    ...timeline.buckets.map((item, index) => {
      const durations =
        item.averageResponseMs === null
          ? ""
          : ` · mean ${formatMs(item.averageResponseMs)} · max ${formatMs(item.maxResponseMs!)}`;
      return {
        value: String(index),
        label: `${formatUtc(item.startMs)} · ${item.hits} hits · ${item.completed} matched${durations}`,
      };
    }),
  ];
  return (
    <section class="panel log-graph-panel">
      <TimelineChart
        timeline={timeline}
        mode={mode}
        selected={selected}
        onSelect={setSelected}
      />
      <div class="log-interval-control">
        <Select
          label="Inspect time interval"
          value={selected}
          onValue={setSelected}
          options={options}
        />
        <p>
          {bucket
            ? `${formatUtc(bucket.startMs)} up to ${formatUtc(bucket.startMs + timeline.intervalMs)} (end excluded).`
            : `Entire log · ${formatInterval(timeline.intervalMs)} intervals.`}
        </p>
      </div>
      <div class="log-table-heading">
        <h3>{mode === "hits" ? "URL hits" : "Individual response times"}</h3>
        <span>
          {mode === "hits"
            ? `${hits.length.toLocaleString()} exact URLs · ${visible.length.toLocaleString()} hits`
            : `${matched.length.toLocaleString()} matched requests`}
        </span>
      </div>
      {mode === "hits" ? (
        <HitTable key={selected} rows={hits} />
      ) : (
        <RequestTable
          key={selected}
          requests={matched}
          label="Response times in selected interval"
        />
      )}
    </section>
  );
}
