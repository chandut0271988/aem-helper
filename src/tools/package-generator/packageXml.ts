import { escapeXml } from "../../utils/xmlUtils";
import type { PackageMetadata } from "./types";

export function validateMetadata(metadata: PackageMetadata): PackageMetadata {
  for (const key of ["name", "group", "version"] as const) {
    if (!metadata[key].trim()) throw new Error(`Package ${key} is required.`);
    if (/[\r\n\x00]/.test(metadata[key]))
      throw new Error(
        `Package ${key} cannot contain line breaks or null characters.`,
      );
    escapeXml(metadata[key]);
  }
  if (metadata.description) escapeXml(metadata.description);
  return {
    name: metadata.name.trim(),
    group: metadata.group.trim(),
    version: metadata.version.trim(),
    description: metadata.description?.trim() ?? "",
  };
}

export function generatePropertiesXml(metadata: PackageMetadata): string {
  const clean = validateMetadata(metadata);
  const entries = {
    ...clean,
    packageFormatVersion: "2",
    packageType: "mixed",
    requiresRoot: "false",
    generator: "AEM Toolbox",
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n<properties>\n${Object.entries(
    entries,
  )
    .map(
      ([key, value]) => `    <entry key="${key}">${escapeXml(value)}</entry>`,
    )
    .join("\n")}\n</properties>\n`;
}

export function generateConfigXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<vaultfs version="1.1">\n    <aggregates>\n        <aggregate type="file"/>\n        <aggregate type="folder"/>\n        <aggregate type="ntbase"/>\n    </aggregates>\n    <handlers>\n        <handler type="file"/>\n        <handler type="folder"/>\n        <handler type="generic"/>\n    </handlers>\n</vaultfs>\n`;
}

function wrapManifestLine(line: string): string {
  const encoder = new TextEncoder();
  let current = "";
  const lines: string[] = [];
  for (const character of line) {
    if (encoder.encode(current + character).length > 70) {
      lines.push(current);
      current = " ";
    }
    current += character;
  }
  lines.push(current);
  return lines.join("\r\n");
}

export function generateManifest(metadata: PackageMetadata): string {
  const { name, group, version } = validateMetadata(metadata);
  return (
    [
      "Manifest-Version: 1.0",
      "Created-By: AEM Toolbox",
      `Content-Package-Id: ${group}:${name}:${version}`,
      "Content-Package-Type: mixed",
    ]
      .map(wrapManifestLine)
      .join("\r\n") + "\r\n\r\n"
  );
}
