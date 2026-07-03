# Architecture

```mermaid
flowchart TD
  A["Obsidian / content source truth"] --> B["Normalized source records"]
  B --> C["Publish manifest"]
  C --> D["Public Astro projection"]
  B --> E["Local admin console"]
  B --> F["Preview adapters"]
  D --> G["Search, feeds, graph, resume assets"]
  G --> H["Static public site"]
```

The publish manifest is the privacy boundary. Local admin tooling may inspect source files and private evidence; public pages consume only approved generated assets.

External writes are outside the default architecture and require L4 approval.
