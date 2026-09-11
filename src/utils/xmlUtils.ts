export function escapeXml(value: string): string {
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (!(
      code === 9 ||
      code === 10 ||
      code === 13 ||
      (code >= 32 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff)
    )) {
      throw new Error("Input contains a character that XML cannot represent.");
    }
  }
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/\t/g, "&#9;")
    .replace(/\r/g, "&#13;")
    .replace(/\n/g, "&#10;");
}
