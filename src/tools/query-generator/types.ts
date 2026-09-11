export type QueryType = "component" | "template" | "property";
interface QueryBase {
  path: string;
  limit: number;
}
export type QueryGeneratorInput = QueryBase &
  (
    | { type: "component"; resourceType: string }
    | { type: "template"; templatePath: string }
    | { type: "property"; nodeType: string; property: string; value: string }
  );
