import { queryParts } from "./queryBuilder";
import type { QueryGeneratorInput } from "./types";

export function escapeSqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

export function generateSql2(input: QueryGeneratorInput): string {
  const { path, nodeType, property, value } = queryParts(input);
  return `SELECT *\nFROM [${nodeType}] AS node\nWHERE ISDESCENDANTNODE(node, '${escapeSqlValue(path)}')\nAND node.[${property}] = '${escapeSqlValue(value)}'`;
}
