import { isValidAemPath } from "../../utils/pathUtils";
import type { Locale, LocalePath } from "./types";

export function parseLocales(input: string): Locale[] {
  const seen = new Set<string>();
  const result: Locale[] = [];
  input.split(/\r\n|\n|\r/).forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line
      .trim()
      .toLowerCase()
      .split(/[,/]/)
      .map((value) => value.trim());
    if (
      parts.length !== 2 ||
      parts.some((value) => !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(value))
    ) {
      throw new Error(
        `Line ${index + 1}: expected country,language or country/language but received "${line.trim()}".`,
      );
    }
    const [country, language] = parts;
    const key = `${country},${language}`;
    if (!seen.has(key)) {
      result.push({ country, language });
      seen.add(key);
    }
  });
  if (!result.length) throw new Error("Enter at least one locale.");
  return result;
}

export function generateLocalePaths(
  basePath: string,
  locales: Locale[],
): LocalePath[] {
  if (!isValidAemPath(basePath))
    throw new Error(
      "Base path must start with / and cannot contain line breaks.",
    );
  const placeholders = basePath.match(/\{[^{}]*\}/g) ?? [];
  if (!placeholders.length)
    throw new Error("Include {country} or {language} in the base path.");
  if (
    placeholders.some(
      (value) => value !== "{country}" && value !== "{language}",
    ) ||
    basePath.replace(/\{country\}|\{language\}/g, "").match(/[{}]/)
  ) {
    throw new Error("Supported placeholders are {country} and {language}.");
  }
  if (!locales.length) throw new Error("Enter at least one locale.");
  return locales.map((locale) => ({
    ...locale,
    path: basePath
      .trim()
      .replaceAll("{country}", locale.country)
      .replaceAll("{language}", locale.language),
  }));
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function generateLocaleCsv(rows: LocalePath[]): string {
  return [
    "country,language,path",
    ...rows.map((row) =>
      [row.country, row.language, row.path].map(csvCell).join(","),
    ),
  ].join("\r\n");
}
