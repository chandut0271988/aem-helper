import { downloadTextFile } from "../utils/download";
import { Icon } from "./Icon";
export function DownloadButton({
  filename,
  content,
  mimeType,
  label,
}: {
  filename: string;
  content: string;
  mimeType?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      class="button"
      disabled={!content}
      onClick={() => downloadTextFile(filename, content, mimeType)}
    >
      <Icon name="download" size={16} />
      {label}
    </button>
  );
}
