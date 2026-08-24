# 🤖 AI Workout Tracker — Agent Operating Guide

> **Meta-instructions for AI coding agents (Claude Code, Cursor, Windsurf, custom agents) working in this repository. Treat this file as normative.**

---

## ⚠️ Mandatory First Rule — Expo Has Changed

> Expo SDK 57 introduced breaking changes across the framework, libraries, configuration keys, and the Router API. Guides written for older SDKs **will** mislead you. **Before writing any code** that touches Expo, React Native, or Expo Router:

1. Read the **versioned official docs**: <https://docs.expo.dev/versions/v57.0.0/>
2. Consult [Expo Router docs](https://docs.expo.dev/router/introduction/) for typed routes and the `+api.ts` serverless convention.
3. Validate package compatibility with: `npx expo install --check`
4. Treat any unversioned tutorial / Stack Overflow answer as **suspect** until confirmed against the links above.

---

## 🎯 Project Snapshot

| Area          | Value (verified against `package.json`)                               |
| :------------ | :-------------------------------------------------------------------- |
| Product       | AI Workout Tracker — cross-platform (iOS / Android / Web) fitness app |
| Runtime       | Expo SDK `~57.0.11` · React Native `0.86.2` · React `19.2.3`          |
| Language      | TypeScript `~6.0.3` — **strict mode**, no `any`                       |
| Navigation    | Expo Router `~57.0.11` (typed routes enabled)                         |
| Styling       | NativeWind `^4.2.6` (Tailwind CSS `^3.4.19`)                          |
| Backend       | Serverless inline API — `src/app/api/**/+api.ts`                      |
| Database      | Neon PostgreSQL — Drizzle ORM `^0.45.2` / Drizzle Kit `^0.31.10`      |
| Auth          | Better Auth `^1.6.25` + `expo-secure-store`                           |
| Data Fetching | TanStack Query `^5.101.4`                                             |
| AI            | Vercel AI SDK `ai ^7.0.56` — model `google/gemini-2.5-flash`          |
| Build/Deploy  | EAS Build & EAS Submit — see [EAS.md](./EAS.md)                       |
| Forms         | React Hook Form + `@hookform/resolvers` + Zod                         |

---

## 🗺️ Source Map

```text
src/
├── app/                      # Expo Router file-based routing
│   ├── (app)/                # Authenticated route group (tabs, workouts, modals)
│   ├── (public)/             # Pre-auth route group (welcome, login, onboarding)
│   ├── api/                  # Serverless handlers (+api.ts)
│   │   ├── auth/             # Better Auth — [...auth]+api.ts
│   │   ├── exercises/        # Catalog + AI instructions endpoints
│   │   ├── home-stats/       # Daily summary / analytics endpoint
│   │   ├── workout-sessions/ # Sessions, calendar & streak endpoints
│   │   └── workouts/         # Template management endpoints
│   ├── _layout.tsx           # Root layout (QueryClient + Auth providers)
│   └── index.tsx             # Entry point & splash guard
├── components/               # Reusable UI primitives & domain components
├── constants/                # App-wide constants & onboarding config
├── contexts/                 # React Contexts (workout session, streak)
├── db/                       # Drizzle schema/, client.ts, seed/
├── hooks/                    # Custom hooks (timers, debounce, fetchers)
├── lib/                      # Auth client, Zod schemas, helpers
└── theme/                    # Design tokens & color palettes
```

---

## ✅ Code Conventions

- **API handlers (`+api.ts`)** — every route must follow the pipeline:
  1. **Better Auth session guard** → unauthenticated = `401`.
  2. **Zod validation** of body/query → malformed = `400`.
  3. **Drizzle ORM** persistence (atomic multi-table writes via `db.batch([...])`).
  4. **Typed JSON** response (success `200`/`201`, not-found = `404`).
- **Imports** — use the `@/*` alias (→ `src/*`); pull tables from `@/db`.
- **DB schema** — never hand-edit generated `drizzle/` migrations. Change `src/db/schema/*.ts`, then run `npm run db:generate` + `npm run db:migrate`.
- **UI** — prefer NativeWind `className` utilities; use tokens from `src/theme`; preserve the glassmorphism design system; respect dark/light modes.
- **Forms** — React Hook Form + Zod resolver; keep shared schemas in `src/lib`.
- **Server state** — use TanStack Query; `invalidateQueries` after mutations.
- **Documentation** — keep `README.md`, `EAS.md`, and this guide in sync with the real config.

---

## 🔍 Quality Gates — run before every commit

```bash
npm run lint          # ESLint + Expo static analysis
npx tsc --noEmit      # TypeScript strict type-check (zero errors)
npx expo-doctor       # Expo SDK 57 project-health validation
```

---

## 🚫 Hard Rules

- `node_modules/` is **off-limits** — never edit generated dependency code.
- **Never commit secrets** (`.env`, service accounts, tokens) — use `eas secret:create`.
- Do not introduce a dependency without verifying SDK 57 support (`npx expo install <pkg>`).
- Do not make styling or config changes outside the existing design-token system.
- Keep API route responses consistent (uniform error shape, typed payloads).

---

## 📚 Documentation Map

| Doc          | Purpose                                                       |
| :----------- | :------------------------------------------------------------ |
| `README.md`  | Full overview, quick start, API reference, DB schema, scripts |
| `EAS.md`     | Build / device registration / store submission / OTA playbook |
| `CLAUDE.md`  | Claude Code onboarding brief (imports this file)              |
| `LICENSE.md` | Techwithemma License — commercial use requires a paid license |
