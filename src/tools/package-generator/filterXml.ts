import { normalizePaths } from "../../utils/pathUtils";
import { escapeXml } from "../../utils/xmlUtils";

export function generateFilterXml(paths: string[]): string {
  const uniquePaths = normalizePaths(paths);
  if (!uniquePaths.length)
    throw new Error("Enter at least one repository path.");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<workspaceFilter version="1.0">\n${uniquePaths.map((path) => `    <filter root="${escapeXml(path)}"/>`).join("\n")}\n</workspaceFilter>\n`;
}
