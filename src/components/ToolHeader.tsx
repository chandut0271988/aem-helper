import { Icon, type IconName } from "./Icon";
export function ToolHeader({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: IconName;
  index: string;
}) {
  return (
    <header class="tool-header">
      <div class="eyebrow">
        <Icon name={icon} size={16} /> TOOL {index}
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
