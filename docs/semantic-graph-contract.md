# Semantic Graph Contract

This document defines the schema and generation heuristics for the semantic graph in the Personal Knowledge Asset OS.

## Target Path
- **JSON Output**: `public/assets/semantic_graph.json`
- **Compiler**: `scripts/build-semantic-graph.js`

---

## 1. Node Schema

Each entity node contains the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes | Unique identifier with type prefix (e.g., `note:slug`, `project:slug`, `deck:slug`, `resume:basics`). |
| `label` | String | Yes | Human-readable title of the node. |
| `type` | String | Yes | Entity type: `note`, `project`, `deck`, or `resume`. |
| `metadata`| Object | Yes | Additional properties such as `file` path or entity summaries. |

---

## 2. Edge Schema

Each relation edge contains the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `source` | String | Yes | The origin node ID. |
| `target` | String | Yes | The target node ID. |
| `weight` | Number | Yes | Relational weight coefficient bounded between `0.0` and `1.0`. |
| `type` | String | Yes | Relational connection type: `link`, `owner`, or `tag_overlap`. |
| `metadata`| Object | No | Contextual metadata (e.g., `shared_tags` list). |

---

## 3. Edge Generation Heuristics (Deterministic Fallbacks)

Edges are generated dynamically at build time utilizing the following deterministic heuristics:

1.  **Wiki-Links (`type: "link"`, weight: `1.0`)**:
    - Triggered by explicit markdown links syntax: `[[target-slug]]` or `[[target-slug|label]]` inside any Note, Project, or Deck.
2.  **Resume Ownership (`type: "owner"`, weight: `1.0`)**:
    - Triggered if a project name defined in `resume.yaml` matches the label or slug of a `project` entity.
3.  **Tag / Keyword Overlap (`type: "tag_overlap"`, weight: `0.25 * overlap_count`)**:
    - Triggered when two distinct nodes share tags or keywords.
    - Each shared tag increases the weight by `0.25`, capped at a maximum weight of `1.0`.

---

## 4. Metadata Schema

The graph root contains a `metadata` object with the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `generated_at` | String | Yes | ISO timestamp for the graph build. |
| `version` | String | Yes | Graph contract version. |
| `total_nodes` | Number | Yes | Must equal `nodes.length`. |
| `total_edges` | Number | Yes | Must equal `edges.length`. |
| `source_summary` | Object | Yes | Build-time source, node type, and edge type counts. |

`source_summary` contains:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `content_sources` | Object | Yes | Number of source files/entities scanned for resume, notes, projects, and decks. |
| `node_types` | Object | Yes | Counts for `resume`, `note`, `project`, and `deck` nodes. |
| `edge_types` | Object | Yes | Counts for `link`, `owner`, and `tag_overlap` edges. |

---

## 5. Validation Rules

`scripts/validate-pipeline.js` validates the semantic graph during `npm run validate:pipeline` and `npm run verify`.

- Reject duplicate node IDs.
- Reject edges whose `source` or `target` does not exist in `nodes`.
- Reject self-referential edges.
- Reject unsupported node or edge types.
- Reject edge weights outside the inclusive `0.0` to `1.0` range.
- Require a valid `metadata.generated_at` timestamp.
- Require `metadata.source_summary.node_types` and `metadata.source_summary.edge_types` to match the actual graph.
