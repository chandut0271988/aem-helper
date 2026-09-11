export function isValidAemPath(path: string): boolean {
  return path.trim().startsWith("/") && !/[\r\n]/.test(path);
}

export function normalizePaths(paths: string[]): string[] {
  const result: string[] = [];
  paths.forEach((raw, index) => {
    if (!raw.trim()) return;
    if (!isValidAemPath(raw))
      throw new Error(
        `Line ${index + 1}: paths must start with / and cannot contain line breaks.`,
      );
    result.push(raw.trim());
  });
  return [...new Set(result)];
}

export function parsePaths(input: string): string[] {
  return normalizePaths(input.split(/\r\n|\n|\r/));
}
