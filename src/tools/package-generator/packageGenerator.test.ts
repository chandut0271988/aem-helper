import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  isValidAemPath,
  normalizePaths,
  parsePaths,
} from "../../utils/pathUtils";
import { escapeXml } from "../../utils/xmlUtils";
import { generateFilterXml } from "./filterXml";
import { buildPackage, packageFilename } from "./packageBuilder";
import {
  generateConfigXml,
  generateManifest,
  generatePropertiesXml,
} from "./packageXml";
import {
  generateLocalePaths,
  parseLocales,
} from "../locale-path-generator/localePaths";

const metadata = {
  name: "homepage-content",
  group: "myproject",
  version: "1.0.0",
  description: "Homepage content package",
};

describe("Package Creator", () => {
  it("deduplicates and trims paths while ignoring blank lines", () => {
    expect(parsePaths(" /content/us \n\n/content/de\r\n/content/us\n")).toEqual(
      ["/content/us", "/content/de"],
    );
  });
  it("reports invalid paths with their original line number", () => {
    expect(() => parsePaths("/content/a\n\ncontent/b")).toThrow(/Line 3/);
  });
  it("rejects embedded line breaks in array paths", () => {
    expect(() => normalizePaths(["/content/a\n/content/b"])).toThrow(
      /line breaks/,
    );
  });
  it("allows varied repository names", () => {
    expect(isValidAemPath(" /content/brand space/日本語:page ")).toBe(true);
  });
  it("generates exactly the requested XML", () => {
    expect(
      generateFilterXml(["/content/us", "/content/de", "/content/us"]),
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<workspaceFilter version="1.0">\n    <filter root="/content/us"/>\n    <filter root="/content/de"/>\n</workspaceFilter>\n',
    );
  });
  it("escapes XML attributes and metadata", () => {
    expect(generateFilterXml(["/content/a&\"<>'"])).toContain(
      "/content/a&amp;&quot;&lt;&gt;&apos;",
    );
    expect(
      generatePropertiesXml({
        ...metadata,
        description: 'A & B <page> "test"',
      }),
    ).toContain("A &amp; B &lt;page&gt; &quot;test&quot;");
  });
  it("preserves XML whitespace with references and rejects invalid XML characters", () => {
    expect(escapeXml("a\tb\nc")).toBe("a&#9;b&#10;c");
    expect(() => generateFilterXml(["/content/\x01"])).toThrow(/XML/);
    expect(() => escapeXml("\ud800")).toThrow(/XML/);
  });
  it("rejects empty filter roots", () => {
    expect(() => generateFilterXml([])).toThrow(/at least one/);
  });
  it("uses the package name and version as the ZIP filename", () => {
    expect(packageFilename(metadata)).toBe("homepage-content-1.0.0.zip");
  });
  it("sanitizes filename separators", () => {
    expect(
      packageFilename({ ...metadata, name: "../home/page", version: "1/0" }),
    ).toBe("-home-page-1-0.zip");
  });
  it("rejects missing metadata", () => {
    expect(() => generatePropertiesXml({ ...metadata, name: " " })).toThrow(
      /name is required/,
    );
  });
  it("rejects manifest header injection", () => {
    expect(() =>
      generateManifest({ ...metadata, group: "myproject\r\nInjected: true" }),
    ).toThrow(/line breaks/);
  });
  it("wraps manifest lines without splitting UTF-8 characters", () => {
    const manifest = generateManifest({
      ...metadata,
      name: "日本語".repeat(40),
    });
    expect(manifest).toContain("\r\n ");
    expect(manifest.endsWith("\r\n\r\n")).toBe(true);
    for (const line of manifest.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(70);
    expect(manifest.replace(/\r\n /g, "")).toContain(
      `myproject:${"日本語".repeat(40)}:1.0.0`,
    );
  });
  it("writes FileVault metadata and configuration", () => {
    const xml = generatePropertiesXml(metadata);
    for (const [key, value] of Object.entries(metadata))
      expect(xml).toContain(`<entry key="${key}">${value}</entry>`);
    expect(generateConfigXml()).toContain('<vaultfs version="1.1">');
  });
  it("builds the requested ZIP skeleton from locale paths with no fake content", async () => {
    const paths = generateLocalePaths(
      "/content/mybrand/{country}/{language}/home",
      parseLocales("us,en\ngb,en\nde,de"),
    ).map((row) => row.path);
    const blob = await buildPackage(metadata, paths);
    expect(blob.type).toBe("application/zip");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(
      [
        "META-INF/",
        "META-INF/MANIFEST.MF",
        "META-INF/vault/",
        "META-INF/vault/config.xml",
        "META-INF/vault/filter.xml",
        "META-INF/vault/properties.xml",
        "jcr_root/",
      ].sort(),
    );
    expect(zip.files["jcr_root/"].dir).toBe(true);
    const filter = await zip.file("META-INF/vault/filter.xml")!.async("string");
    expect(filter).toBe(generateFilterXml(paths));
    expect(filter.match(/<filter root=/g)).toHaveLength(3);
    expect(
      await zip.file("META-INF/vault/properties.xml")!.async("string"),
    ).toBe(generatePropertiesXml(metadata));
    expect(await zip.file("META-INF/MANIFEST.MF")!.async("string")).toBe(
      generateManifest(metadata),
    );
  });
});
