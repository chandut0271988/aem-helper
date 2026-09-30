import type { ComponentType } from "preact";
import type { IconName } from "../components/Icon";
import { QueryGenerator } from "../tools/query-generator/QueryGenerator";
import { LocalePathGenerator } from "../tools/locale-path-generator/LocalePathGenerator";
import { PackageGenerator } from "../tools/package-generator/PackageGenerator";
import { ResponseTimeAnalyser } from "../tools/response-time-analyser/ResponseTimeAnalyser";

export interface ToolProps {
  packagePaths: string[];
  transferId: number;
  onSendPaths: (paths: string[]) => void;
}
interface ToolDefinition {
  id: string;
  name: string;
  navName: string;
  description: string;
  icon: IconName;
  tag: string;
  preview: string;
  component: ComponentType<ToolProps>;
}
export const tools = [
  {
    id: "query-generator",
    name: "Query Generator",
    navName: "Query Generator",
    description:
      "Build Query Builder and JCR-SQL2 queries for components, templates, and properties.",
    icon: "query",
    tag: "FIND YOUR CONTENT",
    preview:
      "path=/content/mybrand\ntype=nt:unstructured\nproperty=sling:resourceType",
    component: QueryGenerator,
  },
  {
    id: "locale-path-generator",
    name: "Locale Path Generator",
    navName: "Locale Paths",
    description:
      "Turn one repository path into a complete set of paths across countries and languages.",
    icon: "locale",
    tag: "SCALE ACROSS LOCALES",
    preview:
      "/content/mybrand/{country}/{language}\n  → /content/mybrand/us/en\n  → /content/mybrand/de/de",
    component: LocalePathGenerator,
  },
  {
    id: "package-generator",
    name: "Package Creator",
    navName: "Package Creator",
    description:
      "Create filter.xml files and downloadable AEM package skeletons from your paths.",
    icon: "package",
    tag: "PREPARE YOUR PACKAGE",
    preview: "META-INF/\n  vault/filter.xml\njcr_root/",
    component: PackageGenerator,
  },
  {
    id: "response-time-analyser",
    name: "Response Time Analyser",
    navName: "Response Times",
    description:
      "Analyse AEM request logs, find slow URLs, and explore hit and response-time distributions.",
    icon: "chart",
    tag: "UNDERSTAND YOUR TRAFFIC",
    preview:
      "[2149932] → GET /content/site/en\n[2149932] ← 200 text/html 4ms\nTimestamp · URL · Response time",
    component: ResponseTimeAnalyser,
  },
] as const satisfies readonly ToolDefinition[];
export type ToolId = (typeof tools)[number]["id"];
export type SelectedTool = "home" | ToolId;
