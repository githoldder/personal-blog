# OfficeCLI Adapter

OfficeCLI is treated as a document execution bridge for `.docx`, `.xlsx`, and `.pptx`.

Preferred flow:

1. Inspect document structure.
2. Apply scoped edits.
3. Render or export preview.
4. Validate layout and issues.
5. Record evidence in walkthrough or `sense/reports/`.

Default strategy:

- L1 Read/View: view, get, query, validate
- L2 DOM Edit: add, set, remove, move, batch
- L3 Raw XML: only when safer APIs cannot express the change

Do not overwrite important source documents without a recoverable copy or explicit task scope.
