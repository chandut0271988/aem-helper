import { tools, type SelectedTool } from "../app/tools";
import { Icon } from "./Icon";
export function Sidebar({
  selected,
  onSelect,
}: {
  selected: SelectedTool;
  onSelect: (id: SelectedTool) => void;
}) {
  return (
    <aside class="sidebar">
      <button
        class="brand"
        type="button"
        onClick={() => onSelect("home")}
        aria-label="AEM Toolbox home"
      >
        <span class="brand-icon">
          <Icon name="query" size={23} />
        </span>
        <span>
          AEM <strong>Toolbox</strong>
          <small>AEM UTILITIES</small>
        </span>
      </button>
      <nav aria-label="Main navigation">
        <button
          class={`nav-item ${selected === "home" ? "active" : ""}`}
          aria-current={selected === "home" ? "page" : undefined}
          onClick={() => onSelect("home")}
        >
          <Icon name="grid" size={18} />
          Overview
        </button>
        <div class="nav-label">
          WORKSPACE <span>{String(tools.length).padStart(2, "0")}</span>
        </div>
        {tools.map((tool) => (
          <button
            key={tool.id}
            class={`nav-item ${selected === tool.id ? "active" : ""}`}
            aria-current={selected === tool.id ? "page" : undefined}
            onClick={() => onSelect(tool.id)}
          >
            <Icon name={tool.icon} size={18} />
            {tool.navName}
          </button>
        ))}
      </nav>
      <div class="sidebar-bottom">
        <Icon name="shield" size={19} />
        <div>
          <strong>Local by design</strong>
          <p>Your inputs stay in your browser.</p>
        </div>
      </div>
      <div class="sidebar-version">
        <span>AEM Toolbox</span>
        <span>v1.0</span>
      </div>
    </aside>
  );
}
