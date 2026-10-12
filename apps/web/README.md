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
├── global.css               Resets, .mono font, tone colors for ToneTag
├── app/
│   ├── providers.tsx        ConfigProvider (theme), antd App, data store, router
│   └── routes.tsx           Every URL → page component
├── theme/
│   ├── tokens.json          Brand colors and type (Figma Tokens Studio format)
│   └── theme.ts             Maps tokens.json → Ant Design theme tokens (light + dark)
├── config/
│   ├── navigation.tsx       Sidebar items (label, path, icon)
│   └── reference.ts         Country and commodity lists for forms
├── layouts/
│   └── AppLayout.tsx        Sidebar, header, search, footer, mobile drawer
├── components/              Small shared pieces built on antd
│   ├── PageHeader.tsx       Breadcrumb + title + action buttons
│   ├── ToneTag.tsx          Colored Tag that passes WCAG AA contrast
│   ├── StatusTag.tsx        Shipment status / delay-risk tags
│   ├── RouteText.tsx        "Montreal › JFK › Lagos" route string
│   └── QuoteTable.tsx       Ranked carrier quote table (used in two pages)
├── pages/                   One file per screen
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

## Common changes

### Add a page

1. Create `src/pages/MyPage.tsx`. Start with `<PageHeader title="…" />`, then put content in
   `<Card size="small">`.
2. Add a `<Route>` in `src/app/routes.tsx`.
3. To show it in the sidebar, add an entry to `NAV_ITEMS` in `src/config/navigation.tsx`.

### Change colors or fonts

Edit `src/theme/tokens.json`. `src/theme/theme.ts` maps those values onto Ant Design's
[design tokens](https://ant.design/docs/react/customize-theme) (`colorPrimary`, `borderRadius`,
component overrides for Layout, Menu and Table). Dark mode follows the operating system and uses
the same file.

### Status colors

Use `<ToneTag tone="success | warning | error | info | neutral">`, not antd's preset
`<Tag color="…">`. The preset colors fail WCAG AA contrast at small sizes. The tone colors live in
`global.css`. Map shipment statuses to tones in `components/StatusTag.tsx`.

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
