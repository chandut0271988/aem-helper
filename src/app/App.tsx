import { useEffect, useState } from "preact/hooks";
import { AppShell } from "../components/AppShell";
import { Dashboard } from "./Dashboard";
import { tools, type SelectedTool } from "./tools";

export function App() {
  const [selected, setSelected] = useState<SelectedTool>("home");
  const [packagePaths, setPackagePaths] = useState<string[]>([]);
  const [transferId, setTransferId] = useState(0);
  const [visited, setVisited] = useState<Set<SelectedTool>>(new Set());
  function selectTool(id: SelectedTool) {
    setVisited((previous) => new Set([...previous, id]));
    setSelected(id);
  }
  function sendPaths(paths: string[]) {
    setPackagePaths(paths);
    setTransferId((value) => value + 1);
    selectTool("package-generator");
  }
  useEffect(() => {
    document.title = `${tools.find((tool) => tool.id === selected)?.name ?? "Overview"} · AEM Toolbox`;
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, [selected]);
  return (
    <AppShell selected={selected} onSelect={selectTool}>
      {selected === "home" && <Dashboard onSelect={selectTool} />}
      {tools.map((tool) => {
        const Tool = tool.component;
        return (
          visited.has(tool.id) && (
            <div key={tool.id} hidden={selected !== tool.id}>
              <Tool
                packagePaths={packagePaths}
                transferId={transferId}
                onSendPaths={sendPaths}
              />
            </div>
          )
        );
      })}
    </AppShell>
  );
}
