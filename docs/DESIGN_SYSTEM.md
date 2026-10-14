# KILOGY Design System: implementation notes

Source: *KILOGY UI/UX Prototype Specification v1.0*. This file records how `apps/web` applies
the spec and where it deviates.

## Approach

The dashboard uses **Ant Design 6** components with a brand theme. There is no custom component
library: tables, forms, tags, steps, timelines and layout are standard antd. Engineers who take
over the code can use the [Ant Design docs](https://ant.design/components/overview) directly. The
layout is dense and data-first: small cards, compact tables, and numbers before decoration.

## Tokens

Defined in `apps/web/src/theme/tokens.json` (Tokens Studio format, importable into Figma). They
are mapped onto antd's theme in `apps/web/src/theme/theme.ts`.

| Token | Value | Use |
|---|---|---|
| Primary Navy | `#0D2C6E` | Top bar, primary buttons (`colorPrimary`) |
| Accent Blue | `#1A6DB5` | Links (`colorLink`), info indicators |
| Light BG | `#EBF2FB` | Not used in the current theme |
| Success Green | `#0A7B4A` | Delivered, success |
| Warning Orange | `#E06400` | Delays, alerts |
| Error Red | `#CC2200` | Incidents, critical alerts |
| Dark Text | `#1A1A2E` | Body text |
| Page BG | `#F4F8FF` | Not used (neutral grey instead, see deviations) |

Other settings: border radius 0, top bar 44 px, base font 13 px, neutral grey page background
(`#eef0f3`). IBM Plex Sans for text; IBM Plex Mono (`.mono`) for tracking numbers, codes and the
status bar.

## Deviations (and why)

1. **Status colors are used only on the indicator square, never on text.** The spec orange on
   white is about 3.4:1 contrast, below the spec's own WCAG AA requirement, so status text stays in
   the body color. See `Indicator` and `global.css`.
2. **Page background is neutral grey instead of the spec's light blue,** and primary buttons use
   Primary Navy; Accent Blue is kept for links.
3. **Secondary text is darker than antd's default** for the same contrast reason (`theme.ts`).
4. **Quotes open the New Shipment flow.** A quote request is steps 1–3 of the 4-step shipment
   form, so there is one form to maintain.
5. **API includes an Architecture tab** that shows the build status of the five layers.
6. **Prices are shown in CAD** at a fixed prototype rate (`src/lib/money.ts`). The AI engine
   prices in USD.

## Responsive behavior

| Width | Navigation | Layout |
|---|---|---|
| ≥ 1200 px | Top bar menu + search + utility links | 6-up stat strip, two-column content |
| 992–1199 px | Top bar menu (overflow items collapse into "…") | 3-up stat strip, single column |
| < 992 px | Menu button opens a drawer with search and all links | 2-up stat strip, wide tables scroll inside their panel |

Dark mode follows the system setting (`prefers-color-scheme`).

## Accessibility

- axe-core (WCAG 2.0/2.1 A + AA) reports 0 violations on every screen, in light and dark mode.
- All form fields have linked labels. Icon-only buttons, sliders, switches and progress bars have
  accessible names.
- antd provides keyboard support for menus, tables, steps, drawers and modals.

## Handoff tools

| Tool | Status |
|---|---|
| Figma | Import `src/theme/tokens.json` with the Tokens Studio plugin |
| Storybook | Not set up. Candidates: `QuoteTable`, `StatusTag`, `Indicator`, `PageHeader` |
| Maze / UserTesting | Run against `npm run dev` or a deployed preview |
