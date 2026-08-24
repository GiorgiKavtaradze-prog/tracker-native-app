@AGENTS.md

# Claude Code — Project Brief

> Companion to **[AGENTS.md](./AGENTS.md)** — read it first. This file adds Claude-specific project context and common commands.

## 🏗️ What This Is

**AI Workout Tracker** — a production-grade, full-stack cross-platform fitness app (iOS / Android / Web) built with:

- **Expo SDK 57** + React Native `0.86.2` + React `19.2.3`
- **Expo Router** — typed routes; the backend lives _inside_ the app as `src/app/api/**/+api.ts` serverless handlers
- **Neon PostgreSQL** + **Drizzle ORM**, with **Better Auth** (`expo-secure-store`) session handling
- **TanStack Query** for server state, **NativeWind v4** (Tailwind) for styling
- **Vercel AI SDK** calling `google/gemini-2.5-flash` as the exercise-form coach

## 🚨 Before Writing Code

1. Read [AGENTS.md](./AGENTS.md) — it is the operating contract.
2. Expo SDK 57 **has changed**; read the versioned docs at https://docs.expo.dev/versions/v57.0.0/.
3. Mirror existing patterns — scan `src/components`, `src/lib`, `src/contexts`, `src/app/api` before editing.

## 🧭 Conventions at a Glance

- Strict TypeScript, `@/*` → `src/*` imports, no `any`.
- Every `+api.ts` route: **session guard → Zod validation → Drizzle → typed JSON**.
- Style with NativeWind/Tailwind `className` only; respect design tokens in `src/theme`.
- Migrate to nothing manually: `npm run db:generate` / `npm run db:migrate`.
- Use TanStack Query for all server data; invalidate after mutations.

## ✅ Verification (mandatory before a commit)

```bash
npm run lint && npx tsc --noEmit && npx expo-doctor
```

## 🛠️ Useful Commands

| Task                  | Command                                                |
| :-------------------- | :----------------------------------------------------- |
| Start dev server      | `npm run start`                                        |
| Android build         | `npm run android`                                      |
| iOS build             | `npm run ios`                                          |
| Web target            | `npm run web`                                          |
| Lint                  | `npm run lint`                                         |
| Type-check            | `npx tsc --noEmit`                                     |
| Generate migrations   | `npm run db:generate`                                  |
| Apply migrations      | `npm run db:migrate`                                   |
| Seed exercise catalog | `npm run db:seed`                                      |
| EAS build             | `eas build --profile development\|preview\|production` |
