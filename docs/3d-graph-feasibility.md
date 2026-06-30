# 3D Graph Feasibility

**Task:** S04-T04  
**Date:** 2026-06-30  
**Status:** Decision recorded

## Decision

Do not implement a production 3D graph in the current sprint.

Keep the current 2D SVG graph as the primary graph browser. A 3D graph can enter a later sprint only as an opt-in experimental view after the 2D graph has stronger mobile pointer support, deterministic layout behavior, and accessibility fallbacks.

Recommended near-term path:

1. Stabilize the 2D graph browser.
2. Add graph interaction quality gates: keyboard navigation, pointer-event dragging, reduced-motion mode, and visual regression checks.
3. Revisit 3D as a separate experiment with a small capped dataset and an explicit fallback to 2D.

## Current Baseline

The current MVP uses:

- Astro page: `src/pages/lab/graph.astro`
- React island: `src/components/SemanticGraph.jsx`
- SVG rendering
- Hand-written force simulation
- Static semantic graph input: `public/assets/semantic_graph.json`

Strengths:

- Small dependency surface.
- Works with existing Astro + React setup.
- Easy to inspect nodes, labels, edge types, and linked source paths.
- Good fit for the current graph size: 4 nodes and 2 edges.

Known constraints:

- Dragging currently uses mouse events rather than pointer events, so mobile drag support needs improvement.
- Simulation state is tied to React state updates every animation frame, which is acceptable at tiny scale but not ideal for larger graphs.
- The layout is random on each mount, so screenshots and visual regression checks are less deterministic.

## Option Comparison

| Option | What It Means | Benefits | Costs | Fit |
| :--- | :--- | :--- | :--- | :--- |
| Keep 2D SVG | Continue evolving the current graph browser | Lowest complexity, inspectable DOM, straightforward styling, best accessibility path | Needs pointer-event support and simulation cleanup | Best primary path |
| Three.js 3D | Build a custom WebGL scene with Three.js primitives, camera controls, raycasting, labels, and custom force layout | High visual ceiling, good for spatial demos, reusable 3D foundation | More code, harder labels, harder accessibility, more visual QA | Later experimental track |
| 3D Force Graph Library | Use a library such as `react-force-graph` for a faster 3D prototype | Fastest 3D proof of concept, built-in interaction patterns | Adds dependency, less control over behavior and styling, still WebGL-bound | Good spike candidate |
| Raw WebGL | Write graph rendering directly against WebGL | Maximum control and learning value | Highest maintenance cost, slowest delivery, little product value now | Not recommended |

## Three.js Assessment

Three.js is the most reasonable foundation if this project later needs a custom 3D graph. It provides WebGL rendering, cameras, scene graph primitives, geometry/material abstractions, controls, and examples that reduce the amount of raw rendering code needed.

Expected implementation pieces:

- Scene, camera, renderer, and responsive canvas lifecycle.
- Orbit or trackball controls.
- Node meshes by type.
- Edge geometry by relation type and weight.
- Raycasting for hover/select.
- HTML or sprite labels.
- A force simulation layer, either custom or via a graph library.
- 2D fallback when WebGL is unavailable or reduced-motion is enabled.

Primary risks:

- Labels are harder in 3D than in SVG. HTML overlays can drift or occlude; sprite labels can become blurry or inaccessible.
- Camera controls create discoverability and mobile usability challenges.
- Visual regression testing becomes harder because camera angle, antialiasing, GPU, and timing all affect snapshots.
- Accessibility is weak unless the graph has a parallel DOM list/detail interface.
- The project would need browser-level QA on desktop and mobile hardware.

## WebGL Assessment

WebGL is widely available in modern browsers, but it is still hardware-, driver-, and browser-setting-dependent. A WebGL graph should never be the only way to inspect knowledge assets.

For this project, raw WebGL is not a good use of engineering time. It would require manually handling shader setup, buffers, hit testing, text rendering, device pixel ratio scaling, resize behavior, and fallback handling. Those are infrastructure problems rather than knowledge-product problems.

Raw WebGL should be considered only if:

- There is a strong requirement for custom GPU rendering beyond Three.js.
- The graph grows to thousands of nodes and SVG/Canvas alternatives fail.
- A dedicated rendering sprint exists with clear performance benchmarks.

## Performance Considerations

Current graph size is tiny, so the limiting factor is not rendering performance. The better question is how the implementation behaves when content grows.

Suggested scale gates:

| Graph Size | Recommended Renderer | Notes |
| :--- | :--- | :--- |
| 1-100 nodes | SVG 2D | Best for labels, selection, accessibility, and debugging |
| 100-1,000 nodes | Canvas 2D or optimized SVG hybrid | Consider clustering and search before 3D |
| 1,000+ nodes | Canvas/WebGL experiment | Require aggregation, filtering, and performance budgets |

Before 3D, the project should add:

- Maximum visible node budget.
- Filter/search controls.
- Deterministic layout seed or cached coordinates.
- Reduced-motion mode.
- Basic frame-time target, such as keeping interactions near 60 fps on a typical laptop for a capped dataset.

## Accessibility Considerations

3D graph rendering cannot be treated as the only interface.

Required fallbacks:

- DOM-based node list.
- Keyboard-selectable relationships.
- Text detail panel for selected node.
- Motion reduction toggle or automatic `prefers-reduced-motion` handling.
- Non-color-only relation encoding, such as line style and text labels.

The current 2D graph already has a detail sidebar and text-based relation list, which is a better accessibility base than a canvas-only or WebGL-only graph.

## Maintenance Risks

3D adds several recurring costs:

- Dependency tracking for Three.js or a graph library.
- Browser and GPU compatibility checks.
- Harder visual bug reports because rendering depends on hardware and driver behavior.
- Interaction complexity across mouse, touch, keyboard, and trackpad.
- Higher onboarding cost for future agents or maintainers.

The current product stage benefits more from explainability and reliable inspection than from spatial novelty.

## Recommended Future Experiment

If 3D enters a later sprint, scope it as an experiment, not a replacement.

Suggested acceptance criteria:

- 3D is behind an explicit "Experimental 3D" toggle.
- 2D remains the default view.
- The 3D view renders the same validated `semantic_graph.json`.
- Node click/hover opens the same detail model as 2D.
- The page falls back to 2D if WebGL initialization fails.
- The view supports a reduced-motion mode.
- A browser screenshot check verifies non-blank rendering on desktop.

Suggested implementation route:

1. Try `react-force-graph` or a Three.js spike in an isolated component.
2. Cap the dataset to 100 visible nodes for the first experiment.
3. Reuse the existing node/edge type color system.
4. Keep labels in a side panel first; avoid dense 3D text labels.
5. Promote to product only after usability is clearly better than 2D for a real task.

## Final Recommendation

3D should not enter S04 implementation.

The next best work is S04-T05: define experimental input guardrails. After that, the graph browser should receive a small stabilization pass focused on mobile pointer events, simulation lifecycle, deterministic layout, and accessibility. A 3D graph can be revisited later as an optional lab mode, with Three.js or a Three.js-based graph library preferred over raw WebGL.

## References

- Three.js documentation: https://threejs.org/docs/
- Three.js examples: https://threejs.org/examples/
- MDN WebGL API: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- MDN Canvas accessibility guidance: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#accessibility
- react-force-graph package documentation: https://github.com/vasturiano/react-force-graph
