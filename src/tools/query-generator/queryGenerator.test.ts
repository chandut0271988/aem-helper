import { describe, expect, it } from "vitest";
import { generateQueryBuilder } from "./queryBuilder";
import { generateSql2 } from "./sql2";
import type { QueryGeneratorInput } from "./types";

const component: QueryGeneratorInput = {
  type: "component",
  path: "/content/mybrand",
  resourceType: "myproject/components/content/hero",
  limit: -1,
};

describe("Query Generator", () => {
  it("generates the requested component predicates", () => {
    expect(generateQueryBuilder(component)).toBe(
      "path=/content/mybrand\ntype=nt:unstructured\nproperty=sling:resourceType\nproperty.value=myproject/components/content/hero\np.limit=-1",
    );
  });
  it("generates the equivalent component SQL2", () => {
    expect(generateSql2(component)).toBe(
      "SELECT *\nFROM [nt:unstructured] AS node\nWHERE ISDESCENDANTNODE(node, '/content/mybrand')\nAND node.[sling:resourceType] = 'myproject/components/content/hero'",
    );
  });
  it("generates template predicates and SQL2", () => {
    const input: QueryGeneratorInput = {
      type: "template",
      path: "/content/mybrand",
      templatePath: "/conf/myproject/settings/wcm/templates/content-page",
      limit: 10,
    };
    expect(generateQueryBuilder(input)).toBe(
      "path=/content/mybrand\ntype=cq:PageContent\nproperty=cq:template\nproperty.value=/conf/myproject/settings/wcm/templates/content-page\np.limit=10",
    );
    expect(generateSql2(input)).toContain(
      "FROM [cq:PageContent] AS node\nWHERE ISDESCENDANTNODE(node, '/content/mybrand')\nAND node.[cq:template] = '/conf/myproject/settings/wcm/templates/content-page'",
    );
  });
  it("generates property/value queries", () => {
    const input: QueryGeneratorInput = {
      type: "property",
      path: "/content/mybrand",
      nodeType: "nt:unstructured",
      property: "status",
      value: "active",
      limit: 0,
    };
    expect(generateQueryBuilder(input)).toBe(
      "path=/content/mybrand\ntype=nt:unstructured\nproperty=status\nproperty.value=active\np.limit=0",
    );
    expect(generateSql2(input)).toContain("node.[status] = 'active'");
  });
  it("escapes SQL string literals in both paths and values", () => {
    const input = {
      ...component,
      path: "/content/brand's",
      resourceType: "hero' OR '1'='1",
    };
    expect(generateSql2(input)).toContain("'/content/brand''s'");
    expect(generateSql2(input)).toContain("= 'hero'' OR ''1''=''1'");
  });
  it.each(["content/brand", "", "  ", "/content\n/brand", "/content\r/brand"])(
    "rejects invalid path %j",
    (path) => {
      expect(() => generateQueryBuilder({ ...component, path })).toThrow(
        /path/i,
      );
      expect(() => generateSql2({ ...component, path })).toThrow(/path/i);
    },
  );
  it.each([NaN, Infinity, -2, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid limit %s",
    (limit) => {
      expect(() => generateQueryBuilder({ ...component, limit })).toThrow(
        /limit/i,
      );
    },
  );
  it("rejects blank required values", () => {
    expect(() => generateSql2({ ...component, resourceType: "  " })).toThrow(
      /required/,
    );
  });
  it("rejects newline predicate injection", () => {
    expect(() =>
      generateQueryBuilder({ ...component, resourceType: "hero\np.limit=999" }),
    ).toThrow(/line breaks/);
  });
  it("rejects SQL identifier injection", () => {
    expect(() =>
      generateSql2({
        type: "property",
        path: "/content",
        nodeType: "nt:base",
        property: "foo] = 'x' OR node.[bar",
        value: "a",
        limit: -1,
      }),
    ).toThrow(/square brackets/);
  });
  it("normalizes surrounding whitespace", () => {
    expect(
      generateQueryBuilder({
        ...component,
        path: " /content/mybrand  ",
        resourceType: " myproject/components/content/hero ",
      }),
    ).toBe(generateQueryBuilder(component));
  });
  it("rejects a relative template path", () => {
    expect(() =>
      generateSql2({
        type: "template",
        path: "/content",
        templatePath: "conf/template",
        limit: -1,
      }),
    ).toThrow(/Template path/);
  });
});
