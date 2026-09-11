import { describe, expect, it } from "vitest";
import {
  generateLocaleCsv,
  generateLocalePaths,
  parseLocales,
} from "./localePaths";

describe("Locale Path Generator", () => {
  it("parses comma-separated locale pairs", () => {
    expect(parseLocales("us,en\ngb,en\nde,de")).toEqual([
      { country: "us", language: "en" },
      { country: "gb", language: "en" },
      { country: "de", language: "de" },
    ]);
  });
  it("parses slash-separated and mixed pairs", () => {
    expect(parseLocales("us/en\ngb,en")).toEqual([
      { country: "us", language: "en" },
      { country: "gb", language: "en" },
    ]);
  });
  it("ignores blank lines, trims spaces and normalizes case", () => {
    expect(parseLocales("\n US , EN \r\n\r\n GB / EN \n")).toEqual([
      { country: "us", language: "en" },
      { country: "gb", language: "en" },
    ]);
  });
  it("accepts language subtags", () => {
    expect(parseLocales("cn,zh-Hans")).toEqual([
      { country: "cn", language: "zh-hans" },
    ]);
  });
  it("reports the original malformed line number, including blank lines", () => {
    expect(() => parseLocales("us,en\n\ngb,en\ngermany")).toThrow(
      'Line 4: expected country,language or country/language but received "germany".',
    );
  });
  it.each(["us,en,gb", "us/", "/en", "us/../en", "us,en/gb", "us,<en>"])(
    "rejects malformed entry %s",
    (entry) => {
      expect(() => parseLocales(entry)).toThrow(/Line 1/);
    },
  );
  it("deduplicates normalized locale pairs in input order", () => {
    expect(parseLocales("us,en\nUS/EN\nbe,nl\nbe,fr")).toHaveLength(3);
  });
  it("rejects an empty locale list", () => {
    expect(() => parseLocales("\n ")).toThrow(/at least one locale/);
  });
  it("replaces both placeholders with the requested paths", () => {
    const rows = generateLocalePaths(
      "/content/mybrand/{country}/{language}/home",
      parseLocales("us,en\ngb,en\nde,de"),
    );
    expect(rows.map((row) => row.path)).toEqual([
      "/content/mybrand/us/en/home",
      "/content/mybrand/gb/en/home",
      "/content/mybrand/de/de/home",
    ]);
  });
  it("replaces repeated placeholders and supports either placeholder alone", () => {
    expect(
      generateLocalePaths(
        "/{country}/{language}/{country}",
        parseLocales("us,en"),
      )[0].path,
    ).toBe("/us/en/us");
    expect(
      generateLocalePaths("/{language}/home", parseLocales("us,en"))[0].path,
    ).toBe("/en/home");
  });
  it.each([
    "/content/plain",
    "/{region}/{language}",
    "/{country}/{language",
    "relative/{country}",
    "/{country}\n",
  ])("rejects invalid base path %s", (path) => {
    expect(() => generateLocalePaths(path, parseLocales("us,en"))).toThrow();
  });
  it("writes valid CSV with quotes, commas, and CRLF rows", () => {
    expect(
      generateLocaleCsv([
        { country: "us", language: "en", path: '/content/a,"b"' },
      ]),
    ).toBe('country,language,path\r\nus,en,"/content/a,""b"""');
  });
});
