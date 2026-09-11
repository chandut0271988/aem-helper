import { isValidAemPath } from "../../utils/pathUtils";
import type { QueryGeneratorInput } from "./types";

function required(value: string, label: string): string {
  if (!value.trim()) throw new Error(`${label} is required.`);
  if (/[\r\n\x00]/.test(value))
    throw new Error(`${label} cannot contain line breaks or null characters.`);
  return value.trim();
}

export function queryParts(input: QueryGeneratorInput) {
  if (!isValidAemPath(input.path))
    throw new Error(
      "Root path must start with / and cannot contain line breaks.",
    );
  const path = required(input.path, "Root path");
  if (!Number.isSafeInteger(input.limit) || input.limit < -1)
    throw new Error(
      "Limit must be a whole number of 0 or more, or -1 for all results.",
    );
  let nodeType: string;
  let property: string;
  let value: string;
  switch (input.type) {
    case "component":
      nodeType = "nt:unstructured";
      property = "sling:resourceType";
      value = required(input.resourceType, "Component resource type");
      break;
    case "template":
      nodeType = "cq:PageContent";
      property = "cq:template";
      value = required(input.templatePath, "Template path");
      if (!isValidAemPath(value))
        throw new Error("Template path must start with /.");
      break;
    case "property":
      nodeType = required(input.nodeType, "Node type");
      property = required(input.property, "Property");
      value = required(input.value, "Value");
      break;
  }
  // Bracketed SQL identifiers must never be able to close the bracket.
  if (/[\[\]]/.test(nodeType) || /[\[\]]/.test(property))
    throw new Error("Node type and property cannot contain square brackets.");
  return { path, nodeType, property, value, limit: input.limit };
}

export function generateQueryBuilder(input: QueryGeneratorInput): string {
  const { path, nodeType, property, value, limit } = queryParts(input);
  return `path=${path}\ntype=${nodeType}\nproperty=${property}\nproperty.value=${value}\np.limit=${limit}`;
}
