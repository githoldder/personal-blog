# Public Release Plan

Target platforms: Cloudflare Pages or Vercel static deployment.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | Project default compatible with Astro 5 |
| Admin exposure | Admin routes remain local-first and require explicit production decision |

No deployment is executed until the release report is reviewed and a human gives L4 approval.
