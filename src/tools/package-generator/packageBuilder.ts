import JSZip from "jszip";
import { generateFilterXml } from "./filterXml";
import {
  generateConfigXml,
  generateManifest,
  generatePropertiesXml,
  validateMetadata,
} from "./packageXml";
import type { PackageMetadata } from "./types";

export function packageFilename(metadata: PackageMetadata): string {
  const { name, version } = validateMetadata(metadata);
  const safe = (value: string) =>
    value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^\.+/, "") || "package";
  return `${safe(name)}-${safe(version)}.zip`;
}

export async function buildPackage(
  metadata: PackageMetadata,
  paths: string[],
): Promise<Blob> {
  const clean = validateMetadata(metadata);
  const zip = new JSZip();
  zip.file("META-INF/MANIFEST.MF", generateManifest(clean));
  zip.file("META-INF/vault/config.xml", generateConfigXml());
  zip.file("META-INF/vault/filter.xml", generateFilterXml(paths));
  zip.file("META-INF/vault/properties.xml", generatePropertiesXml(clean));
  zip.folder("jcr_root");
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
