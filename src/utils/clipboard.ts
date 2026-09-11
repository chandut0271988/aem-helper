export async function copyToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText)
    throw new Error(
      "Clipboard is unavailable. Select the output and copy it manually.",
    );
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    throw new Error(
      "Copy was blocked. Select the output and copy it manually.",
    );
  }
}
