# TESSER — Morpheus AI Visual Fidelity Restoration Implementation Plan
**Document ID:** `docs/ui/morpheus-visual-fidelity-implementation-plan.md`  
**Authoritative Reference:** Superdesign Project `dbdbdf15-37ee-4509-8ea3-4dc70838b4d7` | Draft `59aaed8a-ca91-4cbc-b900-666a7450432a`  
**Brand Identity:** TESSER Smart Learning & Knowledge Platform  
**Target Date:** 2026-11-22  

---

## 1. Executive Summary & Design Objective

The objective of this task is to execute a **Visual Fidelity Restoration** of the Morpheus AI design into the existing TESSER platform codebase. This is neither a generic redesign nor an overhaul of backend logic: it restores the editorial, high-contrast, modular aesthetic defined in the authoritative design specification while preserving TESSER's identity, full-stack architecture, API contracts, and user workflows.

### Superdesign Preflight State
- **CLI Check:** `npx @superdesign/cli@latest auth status` executed.
- **Auth Status:** Interactive `SUPERDESIGN_TOKEN` required (`Not authenticated`). As mandated by Section 1 ("If authentication is missing... do not keep attempting it. Record the limitation and use the supplied HTML and reference material"), the restoration proceeds using the exhaustive specifications, geometry parameters, exact design tokens, and structure provided in the prompt.

---

## 2. Existing Project Architecture & Target Routes

### Architectural Overview
- **Backend:** Django 5.x / Django REST Framework at `backend/` providing authentication, document processing, RAG vector embeddings, knowledge gaps, and analytics on `http://127.0.0.1:8000/`.
- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4 SPA at `frontend/` running on `http://127.0.0.1:5173/`.
- **Primary Landing Route:** Route `/` rendered by `frontend/src/pages/public/LandingPage.jsx`.
- **Django Template Bridge:** Serving `backend/templates/landing.html` and `backend/templates/base.html` directly from Django on `http://127.0.0.1:8000/` ensures dual-stack compliance (pure Django template rendering and React SPA rendering).

---

## 3. Design Token Mapping & Typography

### Non-Negotiable Color Palette
All CSS variables and Tailwind extensions strictly adhere to:
```css
:root {
  --color-charcoal: #0A0A0A;
  --color-sand: #C6B19B;
  --color-taupe: #645A4F;
  --color-canvas: #FAFAF8;
  --color-accent: #EE5937; /* Terracotta accent */
  --color-neon: #00FF88;   /* Subtle system neon */
  --color-purple: #7C3AED;
  --color-outer: #0F0F0F;  /* Deep outer environment */
  --grid-line: rgba(100, 90, 79, 0.12);
}
```

### Typography Hierarchy
- **Primary Display & Headings:** `Inter` (weights 400, 600, 700), tight letter tracking (`tracking-tighter` / `-0.04em`), uppercase where specified.
- **Technical & Metadata:** `JetBrains Mono` (weights 400, 700) for telemetry, ordinals, section badges, system breadcrumbs, and vertical status indicators.

---

## 4. Component Layout & Structural Hierarchy

### 4.1. Outer Environment (`#0F0F0F`)
- Fixed viewport container with fine SVG fractal grain filter (`feTurbulence`).
- Repeating subtle neon green horizontal scanlines spaced at `200px` intervals with `pointer-events: none` and `opacity: 0.04`.

### 4.2. Left Telemetry Panel (15vw desktop width, height 100vh)
- **Top Profile Card:** Collapsible panel with bot avatar, green operational status badge, monospace ID, and chevron-down control animating height (0 to auto) and 180° chevron rotation.
- **Middle Architecture Indicator:** Monospace vertical label `ARCHITECTURE`, thin vertical gradient line with green (`#00FF88`), terracotta (`#EE5937`), and muted white nodes.
- **Bottom Telemetry Stack:** Monospace real-time metrics (Engine status, RAG retrieval rate, context coherence).
- **Responsive Rule:** Completely hidden (`display: none`) at viewport `<= 1024px`.

### 4.3. Main Canvas & Frame (85vw desktop width, offset 15vw)
- Off-white `#FAFAF8` background with `12px` solid `#0A0A0A` frame.
- Top-left corner rounded to `24px`; all other corners remain crisp and square.
- Deep, soft ambient drop shadow.
- At `<= 1024px`: offset set to 0, width 100%, outer frame removed.

### 4.4. 12-Column Modular Grid
- 12 vertical column guidelines with dotted warm-taupe borders (`var(--grid-line)`).
- Decorative overlay with `pointer-events: none` to preserve interactive selection and navigation.

### 4.5. Navigation Bar
- Positioned inside top of main canvas (`48px` horizontal, `40px` vertical padding).
- Left: `TESSER` bold uppercase wordmark with `4px` terracotta accent underline.
- Right: Monospace uppercase links (`FEATURES`, `TECHNOLOGY`, `SYSTEM STATUS`) and bordered `JOIN NOW` / `SIGN IN` action buttons.

### 4.6. Asymmetric Hero Section (min-height ~90vh)
- **Top Metadata:** Monospace system specifications on top-left; vertical system-status label with orange-to-green accent line on top-right.
- **Center 3D Filament Ring:** `#canvas-3d` container positioned at 35% left offset on desktop, centered on mobile.
- **Bottom Typography:** 12-column split (8 cols heading, 4 cols supporting text). Heading `clamp(3.5rem, 9vw, 6rem)` with orange highlighted brand name and taupe supporting text with neon emphasis.

### 4.7. Feature Section ("01 — Core Systems")
- 12-column layout: 4 columns for sticky section indicator and terracotta accent rule; 8 columns for 4 modular feature cards in 2x2 grid.
- Hover interaction: smooth upward translation (-5px), top neon border reveal animating to 40% width.

### 4.8. Technology Section ("02 — Pipeline")
- Deep charcoal `#0A0A0A` background with horizontal neural lines.
- 4 process columns (`01 INGEST`, `02 MAP`, `03 OPTIMIZE`, `04 MASTER`).
- Large monospace numerals with subtle hover border luminescence.

### 4.9. Centered Minimalist Footer
- Off-white canvas continuation, centered system status badge, two-line expressive uppercase headline, and dark rectangular CTA with lightning bolt icon.

---

## 5. Three.js Filament Ring Technical Specification

- **Module:** Three.js r160.
- **Strand Geometry:** ~200 Catmull-Rom curved splines (`CatmullRomCurve3`) transformed into `TubeGeometry` (radius `0.004`, radial segments `6`, tubular segments `150`).
- **Ring Proportions:** Inner radius ~1.3, outer radius ~1.45 with sinusoidal z-axis wobble and radial perturbation.
- **Filament Palette:** 70% deep charcoal (`#1A1A1A`), 15% neon green (`#00FF88`), 15% terracotta (`#EE5937`).
- **Material:** `MeshStandardMaterial` (metalness `0.9`, roughness `0.1`, selective emissive glows `0.8`).
- **Lighting:** White ambient light (`0.5`), neon green point light at `(2, 3, 2)` (intensity `1.2`), terracotta point light at `(-2, -3, -1)` (intensity `1.2`).
- **Animation Loop:** Slow continuous rotation along Y (`0.0015 rad/frame`) and Z (`0.0008 rad/frame`), combined with harmonic breathing scale pulse (±3% oscillation over 6s cycle).
- **Optimization:** Seeded deterministic generation for consistent ring form across reloads; visibility observer to pause rendering when offscreen; pixel ratio clamped to `min(window.devicePixelRatio, 2)`.

---

## 6. GSAP Animation & Scroll Interaction Plan

- **Engine:** GSAP 3.12.5 + ScrollTrigger.
- **Scroll Triggers:**
  - Feature cards: `y: 30`, `opacity: 0` to `y: 0`, `opacity: 1`, duration `0.8s`, ease `power2.out`, triggered at `top 95%`.
  - Technology columns: staggered entrance (`stagger: 0.15s`).
- **Collapsible Profile Panel:** Smooth tween of height (`0` to `auto`) and chevron rotation (`0deg` to `180deg`) using `power3.out`.

---

## 7. Responsive Breakpoint Matrix

| Viewport Width | Telemetry Sidebar | Canvas Width | Canvas Offset | Canvas Frame | 3D Ring Position | Grid Proportions |
|---|---|---|---|---|---|---|
| **> 1024px (Desktop)** | Visible (15vw) | 85vw | 15vw | 12px solid | 35% left | 12 cols (8/4 split) |
| **768px–1024px (Tablet)** | Hidden (0vw) | 100vw | 0 | None (flush) | Centered | Stacked / 2 cols |
| **< 768px (Mobile)** | Hidden (0vw) | 100vw | 0 | None (flush) | Centered | Single column |

---

## 8. File Modification and Creation Matrix

### New Files Created
1. `docs/ui/morpheus-visual-fidelity-implementation-plan.md` (This document)
2. `frontend/src/components/morpheus/TelemetrySidebar.jsx` (Left collapsible telemetry panel)
3. `frontend/src/components/morpheus/FilamentRingCanvas.jsx` (Three.js 3D filament ring)
4. `frontend/src/components/morpheus/ModularGrid.jsx` (12-column editorial overlay)
5. `frontend/src/styles/morpheus-tokens.css` (Strict CSS variables, grain filters, glow pulses)
6. `backend/templates/landing.html` & `backend/templates/base.html` (Django template parity)
7. `backend/static/css/morpheus.css` & `backend/static/js/filament-ring.js` (Django static assets)

### Modified Files
1. `frontend/src/pages/public/LandingPage.jsx` (Morpheus layout with TESSER branding)
2. `frontend/src/index.css` (Integration of Morpheus tokens & fonts)
3. `backend/config/urls.py` (Adding direct `/` route pointing to Django landing view)
4. `backend/config/views.py` (Django landing page view)

---

## 9. Verification & Quality Assurance Strategy

1. **Automated Backend & Frontend Integrity:**
   - `python manage.py check` & `python manage.py test` to verify zero regressions.
   - `npm run build` in `frontend/` to verify zero build errors.
2. **Visual Regression Screenshots:**
   - Multi-breakpoint validation (1920x1080, 1440x900, 1024x768, 390x844).
   - Validation of filament density, color balance, 12-column grid alignment, and sidebar responsiveness.
3. **Interactive Validation:**
   - Profile toggle expansion/collapse.
   - Smooth 3D animation without WebGL memory leaks or frame rate drops.
   - Navigation links to `/login`, `/register`, and section anchors.
