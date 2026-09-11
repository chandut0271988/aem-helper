# AEM Toolbox

A lightweight collection of browser-based utilities for AEM authors, developers, QA engineers, and support teams. Built with Vite, Preact, TypeScript, plain CSS, and JSZip.

## Requirements

- Node.js 22.12 or newer (development, testing, and builds only)
- npm
- A modern browser. Clipboard access requires localhost or HTTPS and browser permission.

## Installation

```sh
npm install
```

The committed lockfile pins dependencies. Use `npm ci` for reproducible CI installs.

The `esbuild` override selects its security-patched 0.28.1 release while retaining Vite 7. The development server, tests, and production build are verified with that override.

## Run locally

```sh
npm run dev
```

Open the local URL printed by Vite. The dashboard links to all three tools. Form values survive tool switching during the current session; refreshing resets them.

## Run tests

```sh
npm test
npm run test:watch
```

Vitest tests cover query generation and escaping, invalid inputs, locale parsing and CSV escaping, path normalization, XML and metadata, filename safety, manifest line wrapping, and extraction of a real generated ZIP. A cross-tool test verifies that the three example locale paths produce exactly three filter roots.

## Production build

```sh
npm run build
```

This type-checks the project and creates static HTML, CSS, and JavaScript in `dist/`. Deploy **only the contents of `dist/`** to any static web host. Relative asset paths support hosting under a subdirectory. No SSR, server-side Node.js process, database, authentication, or application API is required.

To inspect the production build locally:

```sh
npm run preview
```

## Architecture

- `src/app/tools.ts`: one registry for navigation, dashboard cards, and tool components.
- `src/app/App.tsx`: selected-tool state and locale-to-package path transfer. Visited tools stay mounted to preserve edits. No router or global state library.
- `src/components/`: shared shell, navigation, labeled fields, output blocks, copy/download actions, and errors.
- `src/tools/query-generator/`: typed query models, pure predicate and SQL2 generators, UI, and tests.
- `src/tools/locale-path-generator/`: locale parsing, placeholder expansion, CSV formatting, UI, and tests.
- `src/tools/package-generator/`: filter and metadata XML, manifest generation, browser ZIP assembly, UI, and tests.
- `src/utils/`: path validation, XML escaping, clipboard, and object-URL downloads.
- `src/styles/`: design tokens, global styles, layout, and forms. No UI framework or remote fonts.

Business logic does not manipulate the DOM. UI components coordinate functions and render results. Only browser helpers access the clipboard or create downloads. Preact's automatic JSX runtime uses `jsx: react-jsx` with `jsxImportSource: preact`; the application does not use React.

## Included tools

### Query Generator

Generate Query Builder predicates and JCR-SQL2 for component usage, template usage, and property/value queries. Root paths and required values are validated. SQL literals escape apostrophes, bracket-breaking identifiers are rejected, and input line breaks cannot inject additional predicates. Limits must be safe integers greater than or equal to zero, or `-1` for all results.

Each output has its own Copy button and success/error feedback. Editing inputs hides old outputs until regeneration. `p.limit` applies only to Query Builder; set SQL2 limits in the query execution tool. SQL2 uses `ISDESCENDANTNODE`, which matches descendants rather than the root node itself.

### Locale Path Generator

Use a base path such as `/content/mybrand/{country}/{language}/home`. Enter `us,en` or `us/en`, one locale per line. Blank lines and duplicate pairs are removed, whitespace is trimmed, and codes are lowercased. Country/language codes accept two or three letters and optional hyphenated subtags. Errors identify the original invalid line.

Generate paths, copy all, download TXT or CSV, or select **Send to Package Creator**. This transfers generated paths through Preact state and opens Package Creator. Either supported placeholder can be used alone; every occurrence is replaced. Different locales may generate the same path when only one placeholder is used; Package Creator removes duplicate paths.

### Package Generator

Enter package name, group, version, optional description, and one repository path per line. A live `filter.xml` preview contains the normalized, unique paths. Copy or download the XML independently of package metadata, or generate a ZIP:

```text
META-INF/
├── MANIFEST.MF
└── vault/
    ├── config.xml
    ├── filter.xml
    └── properties.xml
jcr_root/
```

Metadata and filters follow the [Apache Jackrabbit FileVault metadata layout](https://jackrabbit.apache.org/filevault/metadata.html) and [package properties format](https://jackrabbit.apache.org/filevault/properties.html). The Java properties DTD identifier is emitted as text; the application does not fetch it. `packageType` is `mixed` to avoid assuming that all selected paths contain only content. Filenames sanitize path separators; XML preserves and escapes entered metadata. `jcr_root/` is intentionally empty.

## Adding a new tool

1. Add a directory under `src/tools/` with typed, independently testable business logic and a functional Preact UI component.
2. Add an entry to `src/app/tools.ts`, including its component, description, icon, and preview text. Navigation and dashboard cards use this registry automatically.
3. Reuse shared fields, `CodeOutput`, clipboard, and download helpers.
4. Add business-logic tests, run `npm test`, then run `npm run build`.

`ToolProps` exposes the current package-path transfer and an `onSendPaths` callback for tools that need it. Extend application state only when another tool requires a specific workflow.

## Limitations

- **No connectivity to AEM.** Nothing is authenticated, queried, retrieved, or installed in a repository. Queries are text for use in a separate AEM environment.
- ZIP downloads are **package definitions/skeletons only**. They contain no actual pages, assets, or fake JCR content. They are not repository backups or content migration packages. Filter roots use FileVault's default import behavior; review and populate packages in your AEM workflow before installation.
- Validation is intentionally lightweight and does not check repository existence, custom node types, indexes, or permissions.
- All form state is in browser memory. There is no storage, analytics, backend, or database. Reloading clears edits.
- Clipboard failures show a readable message; output can still be selected and copied manually.
- ZIP files are assembled in browser memory, so available memory limits very large path lists.
- This independent utility is not an Adobe product.
