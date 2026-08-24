# 🏋️‍♂️ AI Workout Tracker

**Production-grade, cross-platform mobile fitness companion featuring live set logging, streak analytics, full-stack Expo Router API routes, and server-side AI exercise form instructions.**

[![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native 0.86](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://reactnative.dev/)
[![React 19.2](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-6.0_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NativeWind v4](https://img.shields.io/badge/NativeWind-v4_Tailwind-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://www.nativewind.dev/)
[![PostgreSQL & Drizzle](https://img.shields.io/badge/Database-Neon_Postgres_%7C_Drizzle-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-000000?style=for-the-badge&logo=lock&logoColor=white)](https://www.better-auth.com/)
[![License](https://img.shields.io/badge/License-Techwithemma-FF4500?style=for-the-badge)](./LICENSE.md)

---

## 📌 Table of Contents

- [✨ Overview \& Key Features](#-overview--key-features)
- [⚙️ How It Works](#️-how-it-works)
- [🛠 Technology Stack](#-technology-stack)
- [📁 Project Directory Topology](#-project-directory-topology)
- [🔌 Full-Stack API Reference](#-full-stack-api-reference)
- [⚡ Quick Start \& Setup](#-quick-start--setup)
- [🔐 Environment Configuration](#-environment-configuration)
- [💾 Database Management \& Migrations](#-database-management--migrations)
- [📱 Native Build \& EAS Deployment](#-native-build--eas-deployment)
- [🧪 Verification \& Code Quality](#-verification--code-quality)
- [📄 Licensing \& Terms](#-licensing--terms)
- [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Overview & Key Features

**AI Workout Tracker** is a feature-complete, modern full-stack fitness solution designed for iOS, Android, and Web targets. Built with **Expo SDK 57** and **React Native**, it combines a high-performance native UI with a serverless backend API embedded directly inside Expo Router using `+api.ts` handlers.

> [!NOTE]
> **Monorepo Simplicity:** Backend API endpoints, authentication flows, database schema, and native mobile screens co-exist within a unified codebase without requiring a separate web server repository.

### 🌟 Key Highlights

- **🔒 Enterprise-Grade Authentication**: Powered by [Better Auth](https://www.better-auth.com/) supporting Email/Password and Google OAuth, backed by native secure key storage via `expo-secure-store`.
- **🤖 Integrated AI Exercise Coach**: Server-side AI instructions powered by Vercel AI SDK (`ai`) providing personalized form cues, safety tips, and execution guidance per exercise.
- **🏋️ Live Workout Toolkit**: Real-time workout duration timer, rest countdown timer, and set-by-set weight/rep/time tracking.
- **📊 Streak & Analytics Engine**: Home dashboard featuring daily volume metrics, streak counters, and an interactive calendar training history.
- **📚 Workout Routine Library**: Customizable workout templates, exercise search/filtering, target muscle targeting, and custom image handling.
- **🎨 Modern Design System**: Responsive, glassmorphism-inspired UI components engineered with **NativeWind v4** (Tailwind CSS) with fluid dark/light appearance support.
- **⚡ Serverless Backend Infrastructure**: Full-stack server routes (`+api.ts`) connecting to **Neon PostgreSQL** serverless cloud DB through **Drizzle ORM**.
- **📦 Production-Ready EAS Workflows**: Complete EAS build and submit configurations (`development`, `preview`, `production`).

---

## ⚙️ How It Works

### Authentication & Session Flow

```mermaid
flowchart LR
    AuthUI["User submits Auth Form / Google OAuth"] --> BetterAuth["Better Auth Client (@better-auth/expo)"]
    BetterAuth --> AuthRoute["POST /api/auth/* (+api.ts Server Route)"]
    AuthRoute --> Drizzle["Drizzle ORM validates & creates User / Session"]
    Drizzle --> NeonDB[(Neon PostgreSQL Database)]
    AuthRoute --> Token["Session Token & Cookie Issued"]
    Token --> SecureStore["Persisted in Expo SecureStore"]
    SecureStore --> State["AuthContext updates state"]
    State --> Nav["Expo Router redirects to (app) Tab Bar"]
```

### Live Workout Tracking & Session Flow

```mermaid
flowchart LR
    Select["Select Routine / Exercises in (app)"] --> Active["Start Active Session in WorkoutSessionContext"]
    Active --> Timers["Run Workout Duration & Rest Countdown Timers"]
    Timers --> Logging["Log Weight, Reps & Completed Sets in Real-Time"]
    Logging --> Finish["Complete Workout Session"]
    Finish --> PostSession["POST /api/workout-sessions (+api.ts)"]
    PostSession --> Validate["Zod Schema Validation"]
    Validate --> WriteDB["Drizzle ORM stores Session, Sets & Reps"]
    WriteDB --> Streak["Compute Streak & Volume Analytics"]
    Streak --> Invalidate["TanStack Query invalidates cache"]
    Invalidate --> Dashboard["Dashboard & History Calendar auto-update"]
```

### AI Exercise Guidance & Coach Flow

```mermaid
flowchart LR
    ViewEx["User views Exercise Card / Modal"] --> TriggerAI["Tap 'Get AI Guidance'"]
    TriggerAI --> AIRoute["POST /api/exercises/[id]/instructions"]
    AIRoute --> ExMeta["Fetch exercise muscle groups & data from Neon DB"]
    ExMeta --> AISdk["Invoke Vercel AI SDK ('ai') with prompt"]
    AISdk --> LLM["LLM Provider (AI Model Engine)"]
    LLM --> Stream["Return structured form cues & safety tips"]
    Stream --> RenderUI["Render interactive AI Coach Card in Mobile App"]
```

### Database & Migration CLI Flow

```mermaid
flowchart LR
    Schema["Modify src/db/schema/*.ts"] --> Generate["npm run db:generate"]
    Generate --> Sql["Generate SQL Migration in ./drizzle"]
    Sql --> Migrate["npm run db:migrate"]
    Migrate --> Neon[(Apply Schema to Neon PostgreSQL)]
    Push["npm run db:push (Dev Iteration)"] --> Neon
    Seed["npm run db:seed"] --> Populate["Populate Exercise Catalog"]
    Studio["npm run db:studio"] --> Visual["Visual GUI Web Inspector"]
```

### Architecture Topology Overview

```mermaid
flowchart TB
    Client["📱 Mobile Client (iOS / Android / Web)"]
    Router["Expo Router (Typed Routes)"]
    NativeWind["NativeWind v4 (Tailwind CSS)"]
    BetterAuthClient["Better Auth Client + SecureStore"]
    Query["TanStack Query (Cache & State)"]
    ApiRoutes["⚡ Expo Serverless API Layer (+api.ts)"]
    AuthServer["Better Auth Handler (/api/auth)"]
    AIServer["Vercel AI SDK Handler (/api/exercises/[id]/instructions)"]
    DataServer["Data Endpoints (/api/workouts, /api/workout-sessions, /api/home-stats)"]
    Drizzle["Drizzle ORM Engine"]
    NeonDB[(Neon PostgreSQL Serverless Cloud)]
    EAS["EAS Build & Submit Pipelines"]

    Client -->|"Typed Navigation"| Router
    Client -->|"Styled UI Components"| NativeWind
    Client -->|"Session Persistence"| BetterAuthClient
    Client -->|"Data Fetching & Cache"| Query
    Query -->|"HTTP Requests"| ApiRoutes
    ApiRoutes --> AuthServer
    ApiRoutes --> AIServer
    ApiRoutes --> DataServer
    AuthServer --> Drizzle
    DataServer --> Drizzle
    Drizzle -->|"Serverless SQL"| NeonDB
    EAS -->|"Dev / Preview / Production"| Client
```

---

## 🛠 Technology Stack

| Domain               | Technology / Library            | Version / Details                 |
| :------------------- | :------------------------------ | :-------------------------------- |
| **Mobile Runtime**   | Expo SDK                        | `~57.0.11`                        |
| **UI Core**          | React Native / React            | `0.86.2` / `19.2.3`               |
| **Language**         | TypeScript                      | `~6.0.3` (Strict Mode)            |
| **Navigation**       | Expo Router                     | `~57.0.11` (Typed Routes Enabled) |
| **Styling**          | NativeWind / Tailwind CSS       | `v4.2.6` / `^3.4.19`              |
| **Data Fetching**    | TanStack Query                  | `^5.101.4`                        |
| **Form Handling**    | React Hook Form + Zod           | `^7.81.0` / `^5.4.0`              |
| **Authentication**   | Better Auth + Expo Secure Store | `^1.6.25` / `^57.0.1`             |
| **AI Integration**   | Vercel AI SDK                   | `^7.0.56`                         |
| **Backend API**      | Expo Router `+api.ts` Routes    | Serverless Handler Convention     |
| **Database**         | Neon Serverless PostgreSQL      | `@neondatabase/serverless ^1.1.0` |
| **ORM & Migrations** | Drizzle ORM / Drizzle Kit       | `^0.45.2` / `^0.31.10`            |
| **Build & Deploy**   | EAS Build & EAS Submit          | Managed Expo Cloud Pipelines      |

---

## 📁 Project Directory Topology

```text
ai-workout-tracker/
├── assets/                    # App icons, splash screens, tab icons, imagery
├── drizzle/                   # Generated SQL migrations & schema snapshots
├── scripts/                   # Utility scripts (reset project, seeding, etc.)
├── src/
│   ├── app/                   # Expo Router file-based routing architecture
│   │   ├── (app)/             # Authenticated route group (tabs, workouts, modals)
│   │   ├── (public)/          # Pre-auth route group (welcome, login, onboarding)
│   │   ├── api/               # Serverless API routes (+api.ts handlers)
│   │   │   ├── auth/          # Better Auth endpoints ([...auth]+api.ts)
│   │   │   ├── exercises/     # Exercise catalog & AI instruction endpoints
│   │   │   ├── home-stats/    # Analytics & streak calculations
│   │   │   ├── workout-sessions/ # Active & past session logs
│   │   │   └── workouts/      # Routine templates & management
│   │   ├── _layout.tsx        # Root layout with QueryClient & Auth Providers
│   │   └── index.tsx          # Initial entry router & splash guard
│   ├── components/            # Reusable UI primitives & domain components
│   ├── constants/             # App-wide constants, onboarding configurations
│   ├── contexts/              # React Contexts (Workout session, streak state)
│   ├── db/                    # Database layer
│   │   ├── schema/            # Drizzle relational table definitions
│   │   ├── client.ts          # Neon Postgres Drizzle client instance
│   │   └── seed/              # Exercise catalog seeder script
│   ├── hooks/                 # Custom React hooks (timers, debounce, etc.)
│   ├── lib/                   # Utility libraries (auth client, formatting, Zod schemas)
│   └── theme/                 # Design system tokens & color palettes
├── app.json                   # Expo config (typed routes, experimental features)
├── babel.config.js            # Babel preset for Expo & NativeWind
├── drizzle.config.ts          # Drizzle CLI configuration
├── eas.json                   # EAS Build profiles (development, preview, production)
├── tailwind.config.js         # Tailwind CSS theme extension & design tokens
├── tsconfig.json              # Strict TypeScript settings (alias path: @/* -> src/*)
└── package.json               # Dependencies & lifecycle scripts
```

---

## 🔌 Full-Stack API Reference

All backend functionality is hosted directly within the Expo app via `src/app/api/*+api.ts` handlers:

| Endpoint                           |    Method    | Description                                                     |
| :--------------------------------- | :----------: | :-------------------------------------------------------------- |
| `/api/auth/*`                      | `GET / POST` | Better Auth handlers (signup, login, OAuth, session management) |
| `/api/exercises`                   |    `GET`     | Fetch & filter full exercise catalog                            |
| `/api/exercises/[id]`              |    `GET`     | Get exercise details by ID                                      |
| `/api/exercises/[id]/instructions` |    `POST`    | Generate real-time AI exercise execution guide & safety tips    |
| `/api/workouts`                    | `GET / POST` | List user workout routines / Create new workout template        |
| `/api/workout-sessions`            | `GET / POST` | Retrieve training history / Log completed workout session       |
| `/api/home-stats`                  |    `GET`     | Compute daily workout statistics, volume, and active streak     |

---

## ⚡ Quick Start & Setup

### Prerequisites

Ensure your development environment meets the following requirements:

- **Node.js**: `≥ 22.13.0` (Required for Expo SDK 57).
- **Package Manager**: `npm` (bundled with Node.js).
- **PostgreSQL Database**: A running PostgreSQL instance or a free account at [Neon.tech](https://neon.tech/).
- **Expo Go / Development Build**: Installed on your mobile test device or simulator.

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/GiorgiKavtaradze-prog/tracker-native-app.git
   cd tracker-native-app
   ```

2. **Install project dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   ```bash
   # Windows PowerShell
   copy .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

   Edit `.env` and fill in your database connection string and provider credentials.

4. **Initialize Database Schema & Seed Data:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Launch Development Server:**

   ```bash
   npm run start
   ```

   Press `a` to launch on Android Emulator, `i` for iOS Simulator, or scan the QR code with Expo Go / Dev Client.

---

## 🔐 Environment Configuration

> [!IMPORTANT]
> **Physical Device Networking:** When running on a physical phone, `localhost` points to the device itself. Set `EXPO_PUBLIC_API_URL` to your computer's local IP address on your Wi-Fi network (e.g. `http://192.168.1.50:8081`).

| Variable               |     Scope     | Required | Description                                         |
| :--------------------- | :-----------: | :------: | :-------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`  | Mobile Client | **Yes**  | Base API URL for Expo Router `+api.ts` routes       |
| `DATABASE_URL`         | Backend / CLI | **Yes**  | PostgreSQL connection string (e.g., Neon Postgres)  |
| `BETTER_AUTH_URL`      |  Server API   | **Yes**  | Public canonical URL for Better Auth authentication |
| `BETTER_AUTH_SECRET`   |  Server API   | **Yes**  | Encryption key used to secure user sessions         |
| `GOOGLE_CLIENT_ID`     |  Server API   | Optional | OAuth Client ID for Google authentication           |
| `GOOGLE_CLIENT_SECRET` |  Server API   | Optional | OAuth Client Secret for Google authentication       |
| `IMAGEKIT_PRIVATE_KEY` |  Server API   | Optional | Private key for custom image uploads                |

---

## 💾 Database Management & Migrations

Database operations are managed via **Drizzle ORM** and **Drizzle Kit**.

```bash
# Generate SQL migration files from Drizzle schema changes
npm run db:generate

# Apply pending SQL migrations to the database
npm run db:migrate

# Push schema directly to DB (local fast iteration)
npm run db:push

# Seed default exercise database
npm run db:seed

# Launch visual database browser GUI
npm run db:studio
```

> [!TIP]
> Use `npm run db:push` during rapid prototyping, and generate versioned migration files with `npm run db:generate` before committing code.

---

## 📱 Native Build & EAS Deployment

The app includes ready-to-use profiles in `eas.json` for building native iOS `.ipa` and Android `.apk` / `.aab` packages.

### Available EAS Profiles

| Profile       | Target Audience | Output Format                             | Purpose                                 |
| :------------ | :-------------- | :---------------------------------------- | :-------------------------------------- |
| `development` | Developers      | Internal Dev Build                        | Native debugging & hot reload           |
| `preview`     | Testers / QA    | `.apk` (Android) / `.ipa` (iOS)           | Standalone testing on physical hardware |
| `production`  | App Stores      | `.aab` (Google Play) / `.ipa` (App Store) | Production release build                |

### Build Commands

```bash
# Install EAS CLI globally & login
npm install -g eas-cli
eas login

# Build Preview APK for Android testing
eas build --profile preview --platform android

# Build Preview IPA for iOS testing
eas build --profile preview --platform ios

# Submit Production builds to stores
eas submit --platform android
eas submit --platform ios
```

For complete step-by-step iOS device registration and distribution instructions, refer to [EAS.md](./EAS.md).

---

## 🧪 Verification & Code Quality

Maintain high standard code quality using Expo CLI linting and strict TypeScript checks:

```bash
# Run ESLint & Expo static analysis
npm run lint

# Type check TypeScript codebase
npx tsc --noEmit
```

---

## 📄 Licensing & Terms

This project is licensed under the terms of the **Techwithemma License**. See [LICENSE.md](./LICENSE.md) for complete details.

- **Allowed**: Personal learning, research, educational study, and non-commercial portfolio demonstrations.
- **Restricted**: Commercial use, SaaS deployment, client deliverables, paid educational products, or redistribution require an explicit commercial license.

---

## 🙏 Acknowledgements

Built with passion using open-source tools from the mobile and web ecosystem:

- [Expo](https://expo.dev) & [React Native](https://reactnative.dev)
- [Drizzle ORM](https://orm.drizzle.team) & [Neon Postgres](https://neon.tech)
- [Better Auth](https://www.better-auth.com)
- [NativeWind](https://www.nativewind.dev)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [TanStack Query](https://tanstack.com/query)
