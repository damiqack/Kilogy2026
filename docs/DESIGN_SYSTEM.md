# KILOGY Design System — implementation notes

Source: *KILOGY UI/UX Prototype Specification v1.0*. This file records how `apps/web` implements
the spec and where it intentionally deviates.

## Principles → implementation

| Principle | How the dashboard applies it |
|---|---|
| **Clarity** | KPI tiles, one status pill per shipment, tracking IDs in monospace, prices in CAD |
| **Speed (≤ 2 clicks)** | "New Shipment" is on the dashboard and shipments list; alert CTAs deep-link to a pre-filled quote; every tracking # links to its tracking screen |
| **Intelligence** | AI Alert banner on the dashboard, inline AI suggestions while filling in the package step, AI score and risk shown on every quote and shipment |

## Tokens

Defined as CSS custom properties in `apps/web/src/styles.css` and mirrored in
`apps/web/src/design/tokens.json` (Tokens Studio format, so they can be imported into Figma).

| Token | Value | Use |
|---|---|---|
| Primary Navy | `#0D2C6E` | Brand, headings, sidebar |
| Accent Blue | `#1A6DB5` | Buttons, links, highlights |
| Light BG | `#EBF2FB` | Table headers, tinted panels, AI tips |
| Success Green | `#0A7B4A` | Delivered, success |
| Warning Orange | `#E06400` | Delays, alerts (fills, borders, icons) |
| Error Red | `#CC2200` | Incidents, critical alerts |
| Dark Text | `#1A1A2E` | Body text |
| Page BG | `#F4F8FF` | Page background |

Typography: Inter (self-hosted via `@fontsource-variable/inter`) with Arial / Arial Black
fallbacks, and Roboto Mono (`@fontsource/roboto-mono`). Sizes: H1 28 px bold, H2 20 px
semibold, body 14 px, mono 13 px, caption 11 px, CTA 14 px bold.

## Deviations (and why)

1. **Warning text uses `#A34800`, not `#E06400`.** Orange `#E06400` on white is about 3.4:1, below
   the spec's own WCAG AA requirement of 4.5:1. The spec orange is still used for fills, borders
   and icons; only text switches to the darker shade.
2. **Cards are white, not Light BG.** White cards on the `#F4F8FF` page keep tables readable. Light
   BG is used for table headers, tinted panels and AI tips.
3. **Quotes open the New Shipment flow.** The quote request is steps 1–3 of the 4-step shipment
   wizard, so there is a single form to maintain. The Quotes section lists past requests and
   reopens their comparison table.
4. **Dev / API includes an Architecture tab** that shows build status of the five layers (useful
   for the team; not in the spec).
5. **Prices are displayed in CAD** using a fixed prototype rate (`src/lib/money.ts`). The AI engine
   prices in USD.

## Responsive behavior

| Breakpoint | Navigation | Layout |
|---|---|---|
| Desktop ≥ 1280 px (designed at 1440) | Persistent navy sidebar | 4-up KPIs, 2-column content |
| Tablet 768–1279 px | Collapsible icon rail (☰ expands it) | 2-up KPIs, single column |
| Mobile < 768 px (designed at 375) | Bottom tab bar: Dashboard, Shipments, Quotes, Carriers, More | Cards stack; wide tables scroll inside their card |

Dark mode follows the system setting (`prefers-color-scheme`) automatically.

## Accessibility checklist

- Automated check: axe-core (WCAG 2.0/2.1 A + AA rules) reports **0 violations** on every screen,
  light and dark, as of this branch.
- Skip link is the first focusable element; visible focus ring on every control.
- All actions are buttons or links, so everything works from the keyboard; `Esc` closes the tablet
  rail and the mobile "More" sheet.
- ARIA: landmarks and labels on the sidebar, tab bar and search; `aria-current` on nav and on the
  stepper; `aria-expanded` on expandable quote rows; `role="meter"` on score bars; timeline states
  announced to screen readers.
- Reduced motion respected (`prefers-reduced-motion`).

## Handoff tools (spec section 6)

| Tool | Status |
|---|---|
| Figma | Import `src/design/tokens.json` with the Tokens Studio plugin |
| Storybook | Not set up yet. Candidates: `QuoteTable`, `StatusBadge`, `RiskBadge`, `ScoreBars`, `Layout` |
| Zeroheight | Could publish this file and the tokens |
| Maze / UserTesting | Run against `npm run dev` or a deployed preview |
| Lottie | Not used yet; loading states use a CSS spinner |
