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
| Primary Navy | `#0D2C6E` | Sidebar, brand mark |
| Accent Blue | `#1A6DB5` | `colorPrimary`: buttons, links, active states |
| Light BG | `#EBF2FB` | Tinted panels |
| Success Green | `#0A7B4A` | Delivered, success |
| Warning Orange | `#E06400` | Delays, alerts |
| Error Red | `#CC2200` | Incidents, critical alerts |
| Dark Text | `#1A1A2E` | Body text |
| Page BG | `#F4F8FF` | Page background (`colorBgLayout`) |

Other settings: border radius 4 px, header height 56 px, sidebar width 220 px. The system font
stack is used for text, and a monospace stack (`.mono`) for tracking numbers and file names.

## Deviations (and why)

1. **Status tags use darker text shades than the spec colors** (for example warning text `#8a4b00`
   on `#fff4e5`). The spec orange on white is about 3.4:1 contrast, below the spec's own WCAG AA
   requirement. See `ToneTag` and `global.css`.
2. **Secondary text is darker than antd's default** for the same contrast reason (`theme.ts`).
3. **Quotes open the New Shipment flow.** A quote request is steps 1–3 of the 4-step shipment
   form, so there is one form to maintain.
4. **Dev / API includes an Architecture tab** that shows the build status of the five layers.
5. **Prices are shown in CAD** at a fixed prototype rate (`src/lib/money.ts`). The AI engine
   prices in USD.

## Responsive behavior

| Width | Navigation | Layout |
|---|---|---|
| ≥ 1200 px | Full sidebar | 6-up stats, two-column content |
| 768–1199 px | Icon-only sidebar (toggle expands it) | 3-up stats, single column |
| < 768 px | Menu drawer from the header button | 2-up stats, wide tables scroll inside their card |

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
| Storybook | Not set up. Candidates: `QuoteTable`, `StatusTag`, `ToneTag`, `PageHeader` |
| Maze / UserTesting | Run against `npm run dev` or a deployed preview |
