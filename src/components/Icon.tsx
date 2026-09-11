export type IconName =
  | "query"
  | "locale"
  | "package"
  | "grid"
  | "arrow"
  | "copy"
  | "check"
  | "download"
  | "shield"
  | "info"
  | "code";
const paths: Record<IconName, string> = {
  query: "m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18",
  locale:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18",
  package: "m12 3 9 5-9 5-9-5 9-5m-9 5v9l9 5 9-5V8m-9 5v9M7 5.8l9 5V16",
  grid: "M3 3h7v7H3V3m11 0h7v7h-7V3M3 14h7v7H3v-7m11 0h7v7h-7v-7",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  copy: "M9 9h12v12H9V9M15 5V3H3v12h2",
  check: "m5 12 4 4L19 6",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3m-4 9 3 3 5-6",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 11v6m0-11v1",
  code: "M4 4h16v16H4V4m3 4 3 3-3 3m6 1h4",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
