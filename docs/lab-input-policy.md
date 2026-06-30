# Semantic Lab Experimental Input Policy

This document defines the admission criteria and security policy for experimental features in the Semantic Lab (e.g., 3D Graph, MediaPipe, WebGPU).

## 1. Core Principles

- **Default Off (Opt-in Only)**: All experimental capabilities must be disabled by default.
- **Local Isolation**: All calculations and models must run locally in the client browser. No user knowledge assets may be sent to remote APIs.
- **Explicit Revocation**: Users must be able to opt-out and revoke permissions at any time, clearing all stored states.

## 2. Experimental Features Admission & Opt-in Criteria

### 2.1 3D Graph Browser
- **Opt-in Gate**: A settings toggle in the 2D graph interface.
- **Prerequisites**:
  - Stable 2D fallback layout.
  - Media query support for `prefers-reduced-motion: reduce` (disables force-directed animation or uses 2D static layout).
  - Proper pointer events translation for mobile touch screens.
  - Deterministic initial layout matching the 2D counterpart.

### 2.2 MediaPipe Gesture Recognition
- **Opt-in Gate**: Clickable "Enable Gesture Navigation" button.
- **Prerequisites**:
  - Explicit UI consent checkbox explaining camera access purpose.
  - Local model loading indicator and fail-safe fallback to mouse/touch.
  - Automatic release of camera stream upon leaving the lab page or toggling off.

### 2.3 WebGPU Semantic Computing
- **Opt-in Gate**: Clickable "Run Local WebGPU Analytics" button.
- **Prerequisites**:
  - Feature detection checks (`navigator.gpu` presence).
  - Explicit hardware acceleration confirmation prompt.
  - Fallback CPU/WASM computation script.

## 3. External-Sensitive Actions Definition

Under the **Sense v4.0** governance, the following browser actions in the lab are classified as **External-Sensitive (L4/L5 equivalent UI actions)** and must follow these constraints:

| Action | Classification | Mitigation / Constraint |
|---|---|---|
| Camera Access (`getUserMedia`) | Sensitive Device Access | Prompt only after user explicit click; release stream immediately on stop. |
| GPU Adapter Request (`requestAdapter`) | Hardware Inspection | Must check navigator support first; cannot block main thread or render loop. |
| LocalStorage Persisted State | State Storage | Store only the boolean opt-in flags; no metadata or personal assets. |

## 4. Promotion to Production Gates

Before any experimental feature can move out of the lab and into the main blog interface:
1. **Performance**: Zero frame-drops on mid-range mobile devices (maintain 60fps).
2. **Accessibility**: Screen reader readable alternatives for visual graphs.
3. **Audit**: Complete a Sense L4 external write/side-effect audit showing zero external network calls during execution.
