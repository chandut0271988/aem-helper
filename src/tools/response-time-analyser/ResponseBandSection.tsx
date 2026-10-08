import { useId, useState } from "preact/hooks";
import { Icon } from "../../components/Icon";
import { downloadTextFile } from "../../utils/download";
import { responseBands } from "./analysis";
import { generateResponseText } from "./responseText";
import { RequestTable } from "./RequestTable";
import type { RequestRecord } from "./types";

export function ResponseBandSection({
  band,
  requests,
}: {
  band: (typeof responseBands)[number];
  requests: RequestRecord[];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <section
      class={`panel log-band log-band-${band.tone}`}
      aria-labelledby={`${id}-heading`}
    >
      <div class="log-band-heading">
        <div>
          <h2 id={`${id}-heading`}>{band.label}</h2>
          <span>{band.description}</span>
        </div>
        <div class="log-band-actions">
          <strong>{requests.length.toLocaleString()} requests</strong>
          <button
            type="button"
            class="button button-small"
            aria-label={`Download ${band.label} as text`}
            onClick={() =>
              downloadTextFile(
                band.filename,
                generateResponseText(band.label, requests),
              )
            }
          >
            <Icon name="download" size={16} />
            Download TXT
          </button>
          <button
            type="button"
            class="button button-small"
            aria-expanded={expanded}
            aria-controls={`${id}-requests`}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${band.label}`}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      <div id={`${id}-requests`} hidden={!expanded}>
        {expanded && (
          <RequestTable requests={requests} label={`${band.label} requests`} />
        )}
      </div>
    </section>
  );
}
