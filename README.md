# 🏋️ AI Workout Tracker

**Cross-platform workout tracking with live set logging, streaks, and AI-assisted exercise guidance**

Built with [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and [React Native](https://reactnative.dev/),
with a full-stack PostgreSQL API — all in one TypeScript project.

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000020?style=flat-square&logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://reactnative.dev/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://www.nativewind.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://orm.drizzle.team/)

---

## ✨ Overview

AI Workout Tracker is a complete, production-minded fitness application for iOS and Android. It lets you
**plan workouts, track sets in real time, review your training history on a calendar, and maintain streaks** —
while an integrated AI engine explains how to perform each exercise safely.

Routing, authentication, and the backend API all run inside a single Expo project, so the whole stack stays
conventional, version-aligned, and easy to run locally.

> **License notice** — This repository is distributed under the Techwithemma license. Personal learning and
> portfolio use are permitted; commercial use requires a valid license. See [License](#license).

---

## 🧰 Key Features

- **Expo Router navigation** with fully typed routes (`typedRoutes` enabled).
- **Authentication** via [Better Auth](https://www.better-auth.com/) — email/password and Google sign-in, backed by Expo Secure Store.
- **Multi-step onboarding** that captures your fitness profile and training goals.
- **Workout library** — browse templates, create custom workouts, and set cover images.
- **Exercise catalog** — search, select, and manage exercises with image uploads.
- **Live session toolkit** — workout timer, rest timer, and per-set reps / weight / duration logging.
- **Home dashboard** with daily stats and workout streaks.
- **Calendar-based training history** for easy review.
- **AI exercise instructions** served by the app's own API route.
- **Theming** with light and dark appearance support.
- **Full-stack API routes** backed by Neon PostgreSQL and Drizzle ORM.
- **EAS Build / Submit** profiles for development, preview, and production.

## 🧱 Technology Stack

| Layer                | Tools                                          |
| -------------------- | ---------------------------------------------- |
| Mobile runtime       | Expo SDK 57 ・ React Native 0.86 ・ React 19.2 |
| Language             | TypeScript (strict mode)                       |
| Navigation           | Expo Router with typed routes                  |
| Styling              | NativeWind v4 + Tailwind CSS                   |
| Data fetching        | TanStack Query                                 |
| Forms & validation   | React Hook Form + Zod resolvers                |
| Authentication       | Better Auth + expo-secure-store                |
| AI integrations      | Vercel AI SDK (`ai`)                           |
| Backend API          | Expo Router `+api.ts` routes                   |
| Database             | Neon PostgreSQL + Drizzle ORM                  |
| Migrations           | drizzle-kit (`drizzle/` folder)                |
| Build & distribution | EAS Build + EAS Submit                         |

> **Compatibility (SDK 57):** React Native `0.86`, React `19.2`, Node.js `≥ 22.13`, Android 7+, iOS 16.4+.
> See the [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/).

---

## 📁 Project Structure

```text
.
├── assets/                  # App icons, splash, tab icons, workout images
├── drizzle/                 # Generated SQL migrations + schema snapshots
├── src/
│   ├── app/                 # Screens, route groups, tabs, modals & API routes
│   │   ├── (app)/           # Authenticated area (tabs, modals, workouts)
│   │   ├── (public)/        # Onboarding / pre-auth screens
│   │   └── api/             # +api.ts backend routes (auth, workouts, AI…)
│   ├── components/          # Reusable UI & feature components
│   ├── constants/           # App-wide constants & onboarding options
│   ├── contexts/            # Shared workout / streak state
│   ├── db/                  # Drizzle schema, client & seed data
│   ├── hooks/               # Custom hooks (timers, debounce, …)
│   ├── lib/                 # API, auth, image, formatting, validation helpers
│   └── theme/               # Application theme configuration
├── app.json                 # Expo application configuration
├── babel.config.js          # babel-preset-expo + NativeWind preset
├── eas.json                 # EAS build & submit profiles
├── drizzle.config.ts        # Drizzle CLI configuration
├── tsconfig.json            # Strict TypeScript + path aliases (@/*)
└── package.json
```

Path aliases map `@/*` → `src/*` and `@/assets/*` → `assets/*`.

## ✅ Prerequisites

- **Node.js LTS** — SDK 57 requires **22.13 or newer**.
- **npm** (bundled with Node.js).
- A **PostgreSQL** database (e.g. [Neon](https://neon.tech/)) for the API.
- Expo CLI through the local project scripts (`npx expo`).
- **For native builds:** Android Studio and/or Xcode, depending on your target platform.
- **For EAS builds:** an Expo account and the [EAS CLI](https://docs.expo.dev/eas/).

---

## 🚀 Getting Started

1. **Clone the repository and enter the project directory:**

   ```bash
   git clone https://github.com/GiorgiKavtaradze-prog/tracker-native-app.git
   cd tracker-native-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a local environment file:**

   ```bash
   # Windows
   copy .env.example .env
   # macOS / Linux
   cp .env.example .env
   ```

4. **Fill in real credentials** in `.env` for your own services. Never commit `.env` or any server secrets (it is git-ignored).

5. **Apply the database schema and seed the exercise catalog:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development server:**

   ```bash
   npm run start
   ```

   Use the Expo CLI prompt to open the app on an Android emulator, iOS simulator, or a development build.

---

## 🌱 Environment Variables

The app uses public configuration for the mobile client and private credentials for API/database integrations.

| Variable               | Used by                | Description                                    |
| ---------------------- | ---------------------- | ---------------------------------------------- |
| `EXPO_PUBLIC_API_URL`  | Mobile client          | Base URL for the Expo API routes & auth server |
| `DATABASE_URL`         | Server and Drizzle CLI | PostgreSQL connection string                   |
| `BETTER_AUTH_URL`      | API                    | Public base URL used by Better Auth            |
| `BETTER_AUTH_SECRET`   | API                    | Secret used to protect Better Auth sessions    |
| `GOOGLE_CLIENT_ID`     | API                    | Google OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET` | API                    | Google OAuth client secret                     |
| `IMAGEKIT_PRIVATE_KEY` | API                    | Private key for workout image uploads          |

Additional provider configuration may be required for the AI route in
`src/app/api/exercises/[id]/instructions+api.ts`. Keep all provider keys server-side and follow the setup
instructions supplied with your licensed copy.

> **Device networking** — When testing on a physical device, `localhost` points to the device itself. Set
> `EXPO_PUBLIC_API_URL` to an address reachable from the device, such as your computer's local network IP,
> then restart Expo with a cleared cache if necessary.

---

## 🗄️ Database Workflow

Drizzle reads `DATABASE_URL` from the environment and stores migrations in `drizzle/`.

```bash
npm run db:generate   # Generate a migration from schema changes
npm run db:migrate    # Apply committed migrations
npm run db:push       # Push the schema directly during development
npm run db:seed       # Seed the exercise catalog
npm run db:studio     # Open Drizzle Studio
```

Use migrations for shared environments and releases. Reserve `db:push` for local iteration when a migration
file is not needed.

## 🛠️ Development

```bash
npm run start          # Start Expo dev server
npm run android        # Build & run on the Android native project
npm run ios            # Build & run on the iOS native project
npm run web            # Start the web target
npm run lint           # Run Expo lint
```

The project enables **Expo Router typed routes** and the **React Compiler** via `app.json` experiments. Route
files live under `src/app`; API routes use the `+api.ts` convention.

---

## 📦 Build & Release

Three EAS profiles are included:

| Profile       | Purpose                  | Output                                  |
| ------------- | ------------------------ | --------------------------------------- |
| `development` | Local development client | Internal development build              |
| `preview`     | Device testing & QA      | Internal Android APK / iOS device build |
| `production`  | Store release            | Production Android & iOS artifacts      |

**Install & authenticate with EAS:**

```bash
npm install --global eas-cli
eas login
```

**Build a preview release:**

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

**Build & submit a production release:**

```bash
eas build --profile production --platform all
eas submit --platform android
eas submit --platform ios
```

For iOS physical-device registration, credentials, and platform-specific distribution details, see
[EAS.md](./EAS.md).

---

## 🤝 Contributing

1. Create a focused branch from the current development branch.
2. Make the smallest change that fully addresses the issue.
3. Run `npm run lint` and any relevant database or platform checks.
4. Update documentation when behavior, configuration, or commands change.
5. Open a pull request with a concise description and verification notes.

---

## 📄 License

The project is provided under the [License](./LICENSE.md).

- Personal learning and portfolio use are allowed under the stated terms.
- Commercial products, SaaS deployments, client work, paid content, and redistribution require a valid
  commercial license.
- Third-party dependencies and services remain subject to their own licenses and terms.

---

## 🙏 Acknowledgements

Built with the Expo, React Native, Drizzle, Neon, Better Auth, TanStack Query, NativeWind, and EAS
ecosystems.
