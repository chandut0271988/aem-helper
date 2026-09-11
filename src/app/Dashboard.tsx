import { tools, type ToolId } from "./tools";
import { Icon } from "../components/Icon";
export function Dashboard({ onSelect }: { onSelect: (id: ToolId) => void }) {
  return (
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="eyebrow">THE EVERYDAY ESSENTIALS</div>
        <h1>Your AEM work, simplified.</h1>
        <p>
          A few useful tools for the tasks you do again and again.
          <br />
          Generate, copy, and get back to building.
        </p>
      </header>
      <div class="section-heading">
        <h2>Explore your toolbox</h2>
        <span>{tools.length} tools, ready to use</span>
      </div>
      <div class="tool-cards">
        {tools.map((tool, index) => (
          <button
            type="button"
            class={`tool-card tool-card-${tool.icon}`}
            key={tool.id}
            onClick={() => onSelect(tool.id)}
          >
            <div class="card-top">
              <span class="tool-icon">
                <Icon name={tool.icon} size={25} />
              </span>
              <span class="card-number">0{index + 1}</span>
            </div>
            <div class="card-label">{tool.tag}</div>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <pre aria-hidden="true">{tool.preview}</pre>
            <span class="card-action">
              Open tool
              <Icon name="arrow" size={18} />
            </span>
          </button>
        ))}
      </div>
      <section class="workflow-note">
        <span class="workflow-icon">
          <Icon name="locale" size={23} />
          <Icon name="arrow" size={16} />
          <Icon name="package" size={23} />
        </span>
        <div>
          <h2>One path. Every locale. Ready to package.</h2>
          <p>
            Generate your locale paths, then send them straight to Package
            Creator.
          </p>
        </div>
        <button
          class="text-button"
          onClick={() => onSelect("locale-path-generator")}
        >
          Try the workflow
          <Icon name="arrow" size={17} />
        </button>
      </section>
      <div class="dashboard-note">
        <Icon name="shield" size={16} />
        <span>
          No sign-in. No AEM connection. Everything happens in your browser.
        </span>
      </div>
    </div>
  );
}
