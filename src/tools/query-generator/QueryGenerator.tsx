import { useState } from "preact/hooks";
import { ToolHeader } from "../../components/ToolHeader";
import { TextInput } from "../../components/TextInput";
import { Select } from "../../components/Select";
import { CodeOutput } from "../../components/CodeOutput";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Icon } from "../../components/Icon";
import { generateQueryBuilder } from "./queryBuilder";
import { generateSql2 } from "./sql2";
import type { QueryGeneratorInput, QueryType } from "./types";

export function QueryGenerator() {
  const [type, setType] = useState<QueryType>("component");
  const [path, setPath] = useState("/content/mybrand");
  const [resourceType, setResourceType] = useState(
    "myproject/components/content/hero",
  );
  const [templatePath, setTemplatePath] = useState(
    "/conf/myproject/settings/wcm/templates/content-page",
  );
  const [nodeType, setNodeType] = useState("nt:unstructured");
  const [property, setProperty] = useState("status");
  const [value, setValue] = useState("active");
  const [limit, setLimit] = useState("-1");
  const [result, setResult] = useState<{ query: string; sql: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  function generate() {
    setError("");
    try {
      const base = { path, limit: limit.trim() ? Number(limit) : NaN };
      const input: QueryGeneratorInput =
        type === "component"
          ? { ...base, type, resourceType }
          : type === "template"
            ? { ...base, type, templatePath }
            : { ...base, type, nodeType, property, value };
      setResult({
        query: generateQueryBuilder(input),
        sql: generateSql2(input),
      });
      setDirty(false);
    } catch (reason) {
      setResult(null);
      setError(
        reason instanceof Error ? reason.message : "Unable to generate query.",
      );
    }
  }
  return (
    <>
      <ToolHeader
        title="Query Generator"
        description="Go from a content question to a ready-to-use AEM query."
        icon="query"
        index="01"
      />
      <div class="workspace-grid">
        <form
          class="panel form-panel"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
          onInput={() => setDirty(true)}
        >
          <div class="panel-heading">
            <h2>Query settings</h2>
            <span>01 / INPUT</span>
          </div>
          <Select
            label="Query type"
            value={type}
            options={[
              { value: "component", label: "Component usage" },
              { value: "template", label: "Template usage" },
              { value: "property", label: "Property / value" },
            ]}
            onValue={(next) => {
              setType(next);
              setDirty(true);
              setError("");
            }}
          />
          <TextInput
            label="Root path"
            value={path}
            onValue={setPath}
            spellcheck={false}
            hint="The repository subtree you want to search."
          />
          {type === "component" && (
            <TextInput
              label="Component resource type"
              value={resourceType}
              onValue={setResourceType}
              spellcheck={false}
            />
          )}
          {type === "template" && (
            <TextInput
              label="Template path"
              value={templatePath}
              onValue={setTemplatePath}
              spellcheck={false}
            />
          )}
          {type === "property" && (
            <>
              <TextInput
                label="Node type"
                value={nodeType}
                onValue={setNodeType}
              />
              <TextInput
                label="Property"
                value={property}
                onValue={setProperty}
              />
              <TextInput label="Value" value={value} onValue={setValue} />
            </>
          )}
          <TextInput
            label="Limit"
            value={limit}
            onValue={setLimit}
            type="number"
            step="1"
            min="-1"
            hint="Use -1 for all results. Applies to Query Builder only."
          />
          <ErrorMessage message={error} />
          <button type="submit" class="button button-primary">
            <Icon name="query" size={17} />
            Generate queries
            <Icon name="arrow" size={17} />
          </button>
        </form>
        <div class="results-column">
          <div class="results-heading">
            <h2>Generated queries</h2>
            <span class="subtle-tag">TEXT OUTPUT</span>
          </div>
          {result && !dirty ? (
            <>
              <CodeOutput
                title="Query Builder"
                language="PREDICATES"
                value={result.query}
              />
              <CodeOutput title="JCR-SQL2" language="SQL" value={result.sql} />
              <p class="output-note">
                <Icon name="info" size={16} />
                Set SQL2 result limits in the execution tool. Queries are
                generated here and run in your AEM environment.
              </p>
            </>
          ) : (
            <div class="empty-output">
              <span class="empty-icon">
                <Icon name="query" size={30} />
              </span>
              <h3>
                {dirty && result
                  ? "Settings updated"
                  : "Your queries will appear here"}
              </h3>
              <p>
                {dirty && result
                  ? "Generate again to use your latest settings."
                  : "Choose a query type, enter your details, and generate both query formats."}
              </p>
              <span class="empty-formats">
                QUERY BUILDER <span>+</span> JCR-SQL2
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
