import { useId } from "preact/hooks";
import { formatInterval, formatMs, formatUtc } from "./analysis";
import type { Timeline, TimeBucket } from "./types";

export function TimelineChart({
  timeline,
  mode,
  selected,
  onSelect,
}: {
  timeline: Timeline;
  mode: "hits" | "time";
  selected: string;
  onSelect: (value: string) => void;
}) {
  const { buckets, intervalMs } = timeline;
  const id = useId();
  const width = 960,
    height = 290,
    left = 75,
    right = 22,
    top = 30,
    bottom = 55;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const highest = Math.max(
    1,
    ...buckets.map((bucket) =>
      mode === "hits" ? bucket.hits : (bucket.maxResponseMs ?? 0),
    ),
  );
  const tickSize = Math.max(
    mode === "hits" ? 1 : 0.25,
    10 ** Math.floor(Math.log10(highest / 4)),
  );
  const ceiling = Math.ceil(highest / (4 * tickSize)) * 4 * tickSize;
  const step = plotWidth / Math.max(1, buckets.length);
  const x = (index: number) => left + step * (index + 0.5);
  const y = (value: number) => height - bottom - (value / ceiling) * plotHeight;
  const line = (field: "averageResponseMs" | "maxResponseMs") => {
    let connected = false;
    return buckets
      .map((bucket, index) => {
        const value = bucket[field];
        if (value === null) {
          connected = false;
          return "";
        }
        const command = connected ? "L" : "M";
        connected = true;
        return `${command}${x(index)},${y(value)}`;
      })
      .join(" ");
  };
  const description = (bucket: TimeBucket) =>
    `${formatUtc(bucket.startMs)}; ${bucket.hits} incoming hits; ${bucket.completed} matched responses${bucket.averageResponseMs === null ? "" : `; mean ${formatMs(bucket.averageResponseMs)}; maximum ${formatMs(bucket.maxResponseMs!)}`}`;
  const ticks = 4;
  return (
    <div class="log-chart">
      <div class="log-chart-heading">
        <h3>
          {mode === "hits"
            ? "Incoming hits over time"
            : "Response times over time"}
        </h3>
        <span>{formatInterval(intervalMs)} buckets · UTC</span>
      </div>
      {mode === "time" && (
        <div class="log-legend">
          <span>
            <i class="mean" />
            Mean
          </span>
          <span>
            <i class="maximum" />
            Maximum
          </span>
        </div>
      )}
      <div class="log-chart-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-description`}
        >
          <title id={`${id}-title`}>
            {mode === "hits"
              ? "Request load distribution"
              : "Response time distribution"}
          </title>
          <desc id={`${id}-description`}>
            {buckets.length} intervals of {formatInterval(intervalMs)}.{" "}
            {mode === "hits"
              ? "Bars count all valid incoming requests, including those without a response."
              : "Green shows mean and orange shows maximum duration among matched responses. Gaps have no matched responses."}{" "}
            Use the Inspect time interval control below for values and request
            details.
          </desc>
          <text x={left} y={16} class="log-axis-title">
            {mode === "hits" ? "Hits" : "Response time (ms)"}
          </text>
          {Array.from({ length: ticks + 1 }, (_, index) => {
            const value = (index * ceiling) / ticks;
            return (
              <g key={index}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(value)}
                  y2={y(value)}
                  class="log-gridline"
                />
                <text
                  x={left - 10}
                  y={y(value) + 4}
                  text-anchor="end"
                  class="log-axis-label"
                >
                  {Math.round(value).toLocaleString()}
                </text>
              </g>
            );
          })}
          {mode === "time" && (
            <>
              <path d={line("maxResponseMs")} class="log-line log-line-max" />
              <path
                d={line("averageResponseMs")}
                class="log-line log-line-mean"
              />
            </>
          )}
          {buckets.map((bucket, index) => (
            <g key={bucket.startMs}>
              {mode === "hits" ? (
                <rect
                  x={x(index) - step * 0.36}
                  y={y(bucket.hits)}
                  width={Math.max(1, step * 0.72)}
                  height={y(0) - y(bucket.hits)}
                  class={`log-bar ${selected === String(index) ? "selected" : ""}`}
                />
              ) : (
                bucket.averageResponseMs !== null && (
                  <>
                    <circle
                      cx={x(index)}
                      cy={y(bucket.maxResponseMs!)}
                      r={2.5}
                      class="log-point-max"
                    />
                    <circle
                      cx={x(index)}
                      cy={y(bucket.averageResponseMs)}
                      r={2.5}
                      class="log-point-mean"
                    />
                  </>
                )
              )}
              <rect
                x={left + index * step}
                y={top}
                width={step}
                height={plotHeight}
                class={`log-chart-target ${selected === String(index) ? "selected" : ""}`}
                onClick={() => onSelect(String(index))}
              >
                <title>{description(bucket)}</title>
              </rect>
            </g>
          ))}
          {[
            ...new Set([
              0,
              Math.floor((buckets.length - 1) / 2),
              buckets.length - 1,
            ]),
          ].map((index) => (
            <g key={index}>
              <text
                x={x(index)}
                y={height - 28}
                text-anchor={
                  index === 0
                    ? "start"
                    : index === buckets.length - 1
                      ? "end"
                      : "middle"
                }
                class="log-axis-label"
              >
                {new Date(buckets[index].startMs).toISOString().slice(11, 19)}
              </text>
              <text
                x={x(index)}
                y={height - 10}
                text-anchor={
                  index === 0
                    ? "start"
                    : index === buckets.length - 1
                      ? "end"
                      : "middle"
                }
                class="log-axis-label"
              >
                {new Date(buckets[index].startMs).toISOString().slice(0, 10)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p class="log-muted">
        {mode === "hits"
          ? "Includes incoming requests without a matching response. Empty intervals show zero hits."
          : "Durations are grouped by the incoming request timestamp. Empty intervals are gaps, not zero-duration responses."}{" "}
        Click an interval or use the selector below.
      </p>
    </div>
  );
}
