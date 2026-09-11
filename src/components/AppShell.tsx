import type { ComponentChildren } from "preact";
import { tools, type SelectedTool } from "../app/tools";
import { Sidebar } from "./Sidebar";
import { Icon } from "./Icon";
export function AppShell({
  selected,
  onSelect,
  children,
}: {
  selected: SelectedTool;
  onSelect: (id: SelectedTool) => void;
  children: ComponentChildren;
}) {
  const current = tools.find((tool) => tool.id === selected);
  return (
    <div class="app-shell">
      <a class="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar selected={selected} onSelect={onSelect} />
      <div class="main-shell">
        <header class="topbar">
          <div class="breadcrumb">
            Workspace<span>/</span>
            <strong>{current?.name ?? "Overview"}</strong>
          </div>
          <span class="browser-badge">
            <Icon name="shield" size={14} />
            100% browser-based
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer class="app-footer">
          <span>Small utilities. Less repetitive work.</span>
          <span>Built for Adobe Experience Manager</span>
        </footer>
      </div>
    </div>
  );
}
