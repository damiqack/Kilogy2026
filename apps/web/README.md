# @kilogy/web

The Kilogy web dashboard (Layer 1: Client Interface). It is built with React 19, TypeScript, Vite,
React Router and [Ant Design 6](https://ant.design/components/overview).

The UI uses stock Ant Design components with a small theme layer. If you know Ant Design, you can
change any screen without learning a custom component library.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run typecheck
```

The app runs on its own with sample data. If the AI engine is running (`services/ai-engine`, port
4200), quotes come from it live. Otherwise the app falls back to local mock rates, and the footer
shows "Routing engine: offline". Point at a different engine with `VITE_AI_ENGINE_URL`.

## Folder structure

```
src/
├── main.tsx                 Entry point
├── global.css               App shell, page header, status indicators, panel overrides
├── app/
│   ├── providers.tsx        ConfigProvider (theme), antd App, data store, router
│   └── routes.tsx           Every URL → page component
├── theme/
│   ├── tokens.json          Brand colors and type (Figma Tokens Studio format)
│   └── theme.ts             Maps tokens.json → Ant Design theme tokens (light + dark)
├── config/
│   ├── navigation.tsx       Top-bar items (label, path, main/utility group)
│   └── reference.ts         Country and commodity lists for forms
├── layouts/
│   └── AppLayout.tsx        Top bar, search, status bar, mobile drawer
├── components/              Small shared pieces built on antd
│   ├── PageHeader.tsx       Breadcrumb + title + action buttons
│   ├── Indicator.tsx        Colored square + plain text status marker
│   ├── StatusTag.tsx        Shipment status / delay-risk tags
│   ├── RouteText.tsx        "Montreal › JFK › Lagos" route string
│   └── QuoteTable.tsx       Ranked carrier quote table (used in two pages)
├── pages/                   One file per screen
│   └── landing/             Public homepage at / (content.ts, LaneMap.tsx, landing.css)
├── data/
│   ├── types.ts             Shared types (Shipment, Quote, RankedOption, …)
│   ├── store.tsx            In-memory app state + actions (useStore hook)
│   ├── ai.ts                Calls the AI engine; mock fallback
│   ├── carriers.ts          Carrier list, mock rate generator
│   ├── seed.ts              Sample shipments, quotes, alerts
│   └── useEngineStatus.ts   Polls AI engine health
└── lib/
    ├── format.ts            Dates, kg, places
    └── money.ts             USD → CAD display
```

## URLs

| Path | What it is |
|---|---|
| `/` | Public homepage (no app shell) |
| `/dashboard` | Signed-in overview |
| `/shipments`, `/quotes`, `/carriers`, … | App screens inside the top-bar shell |

## Common changes

### Edit the homepage

All homepage text, the quote-box city lists and the sample quote are in
`src/pages/landing/content.ts`. The lane diagram's cities and routes are the lists at the top of
`LaneMap.tsx`. Styles are in `landing.css` (every class starts with `lp-`). The quote box sends
people to `/shipments/new?from=CA:Montreal&to=NG:Lagos`, which pre-fills the shipment form.

### Add a page

1. Create `src/pages/MyPage.tsx`. Start with `<PageHeader title="…" />`, then put content in
   `<Card size="small">`.
2. Add a `<Route>` in `src/app/routes.tsx`.
3. To show it in the top bar, add an entry to `NAV_ITEMS` in `src/config/navigation.tsx`
   (`group: "main"` for the menu, `"utility"` for the right-hand links).

### Change colors or fonts

Brand colors live in `src/theme/tokens.json`. `src/theme/theme.ts` maps them onto Ant Design's
[design tokens](https://ant.design/docs/react/customize-theme) and sets the rest of the look:
IBM Plex Sans / Mono (self-hosted via `@fontsource`), square corners (`borderRadius: 0`), 13 px
base size, flat panels and compact tables. Dark mode follows the operating system.

### Status colors

Use `<Indicator tone="success | warning | error | info | neutral">`: a small colored square
followed by plain text. The text keeps the normal text color, so contrast never depends on the
tone. Square colors live in `global.css` (`.ind-*`). Map shipment statuses to tones in
`components/StatusTag.tsx`.

### Connect the real backend

Pages only read and write data through `useStore()` (`src/data/store.tsx`), and quotes only through
`requestQuote()` (`src/data/ai.ts`). To move to the Node API in `services/api`:

1. Replace the store's in-memory arrays with API calls (or React Query hooks) that return the same
   types from `data/types.ts`.
2. Delete `seed.ts` once real data is available.

Pages do not need to change.

### Accessibility

Every form field has a visible label linked with `htmlFor`/`id`. Every icon-only control has an
`aria-label`. We check each screen with axe-core (WCAG 2.1 A/AA) in light and dark mode. Keep new
screens at zero violations.
