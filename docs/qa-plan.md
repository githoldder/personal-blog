# QA Plan

The project uses a V-model testing structure under `tests/v-model`.

## Verification Levels

| Design artifact | Test level | Directory |
| --- | --- | --- |
| Project charter / PRDs | Requirements validation | `tests/v-model/01-requirements` |
| Public site and admin system | System tests | `tests/v-model/02-system` |
| Build scripts and generated assets | Integration tests | `tests/v-model/03-integration` |
| Astro pages, React components, API routes | Component tests | `tests/v-model/04-component` |
| Parser helpers and schema functions | Unit tests | `tests/v-model/05-unit` |

CLI verification runs through `npm run validate:prd`, `npm run validate:pipeline`, `npm test`, `npm run build:resume`, `npm run build:semantic-intelligence`, and `npm run build`.
