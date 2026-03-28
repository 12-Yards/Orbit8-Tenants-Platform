# Golf Junkies (formerly MumblesVibe)

## Overview
Golf Junkies is a community-driven platform for golf enthusiasts, designed to help users discover golf content, events, competitions, and community features. It functions as a comprehensive golf community site with articles, podcasts, reviews, events, groups, and social features.

## User Preferences
I prefer detailed explanations and a clear, modular approach to development. When implementing new features or making significant changes, please ask for confirmation before proceeding. I expect the agent to prioritize maintainability and scalability in all architectural decisions.

## System Architecture

### Frontend (Next.js App Router)
The frontend is built using **Next.js 16** with the App Router pattern and TypeScript. Styling is handled with Tailwind CSS, augmented by `shadcn/ui` components. A custom `ThemeProvider` with `localStorage` persistence ensures a consistent user experience across dark and light modes. The UI/UX emphasizes a responsive, clean design with intuitive navigation and content presentation.

- **Framework**: Next.js 16 with Turbopack (App Router)
- **State Management**: Redux Toolkit with RTK Query for server state (`src/store/api.ts`, `src/store/store.ts`, `src/store/hooks.ts`). Redux Provider wraps the app in `src/app/client-app.tsx`.
- **HTTP Client**: All API calls use `axios` via a shared instance at `src/lib/api.ts` (configured with `withCredentials: true`). The `apiRequest` helper in `src/lib/queryClient.ts` wraps axios and returns `AxiosResponse` (used by some mutations that don't have dedicated RTK endpoints).
- **Routing**: Next.js file-based routing via `src/app/` directory
- **Port**: Configurable via `PORT` env var (default: 5000)

### Backend (Express.js - Standalone)
The backend runs as a **standalone Express.js server**. It handles all API routes, authentication, and data persistence via PostgreSQL with Prisma ORM.

- **Port**: Configurable via `BACKEND_PORT` env var (default: 5001)
- **CORS**: Enabled for cross-origin requests from the Next.js frontend
- **Authentication**: JWT tokens stored in httpOnly cookies (cookie name: `token`, 7-day expiry). Uses `jsonwebtoken` for signing/verification and `cookie-parser` for reading cookies. Environment variable: `JWT_SECRET`.

### API Proxy
Next.js proxies API requests to the Express backend via rewrites in `next.config.mjs` (uses `BACKEND_PORT` env var):
- `/api/*` → `http://localhost:${BACKEND_PORT}/api/*`
- `/objects/*` → `http://localhost:${BACKEND_PORT}/objects/*`
- `/uploads/*` → `http://localhost:${BACKEND_PORT}/uploads/*`

### Shared
Zod schemas in `shared/` directory maintain type safety and data consistency across both frontend and backend.

### Directory Structure
```
/
├── src/
│   ├── app/              (Next.js App Router - route wrappers)
│   ├── page-components/  (Actual page component implementations)
│   ├── components/       (Reusable UI components)
│   ├── hooks/            (Custom React hooks)
│   ├── store/            (Redux store, RTK Query API slice, typed hooks)
│   ├── lib/              (Utilities, API client, apiRequest helper)
│   ├── styles/           (globals.css)
├── server/               (Express backend - standalone on port 5001)
│   ├── index.ts          (Express server entry point)
│   ├── routes.ts         (API route definitions)
│   ├── auth.ts           (Authentication logic)
│   ├── storage.ts        (Database storage interface)
│   └── replit_integrations/  (Object storage, Stripe, auth integrations)
├── prisma/               (Prisma schema and migrations)
├── shared/               (Shared types/schemas - TypeScript + Zod)
├── public/               (Static assets)
├── next.config.mjs       (Next.js config with API rewrites)
├── tailwind.config.ts    (Tailwind configuration)
└── tsconfig.json         (TypeScript config)
```

### Core Features
- **Content Management**: Dynamic handling of articles, events, and editorial content, including categories and rich media.
- **User Interaction**: Features like newsletter subscriptions, user authentication (email/password), profiles, comments with replies, reactions, and community posts (Vibe Board).
- **Administrative Tools**: A comprehensive admin panel for managing users, content (articles, events, polls, reviews), event suggestions, and site settings (section visibility, platform name, social links, logo, terms/privacy pages).
- **SEO**: Next.js metadata API for dynamic meta tags and improved search engine visibility.
- **Image Storage**: Sirv CDN for image/file uploads via server-proxied multipart upload (`POST /api/uploads/file`). Replit Object Storage for backward-compat serving of legacy `/objects/` paths.
- **Review System**: User-submitted reviews of local businesses with an admin approval workflow.
- **Community Polls**: Admins can create multi-option polls with voting functionality for authenticated users.
- **Group Management**: Support for public and private groups, with admin type filter (Community/Event/Competition).
- **Guest Players**: Competition entries support guest players via `guest:Name` prefix in `assignedPlayerIds`.
- **Event Attendance**: "I will attend" toggle for social/standard events with attendance counter and "My Calendar" dialog.
- **Podcasts**: Podcast listings with media playback support.
- **Play/Competitions**: Golf play requests, tee time offers, and competition management with bracket views.

## External Dependencies
- **Sirv CDN**: Image/file hosting via REST API (`server/services/sirv.ts`). Credentials: `SIRV_CLIENT_ID`, `SIRV_CLIENT_SECRET`, `SIRV_CDN_URL`.
- **Replit Object Storage**: Legacy — only used for serving old `/objects/` paths via signed URL redirect.
- **Mux**: Video upload and streaming for article/editorial video sections.
- **bcrypt**: For password hashing in custom email/password authentication.
- **jsonwebtoken**: For JWT-based authentication (tokens stored in httpOnly cookies).
- **Stripe**: For payment processing (subscriptions, competition entries).

## Workflow
The application runs via a single workflow command:
```
BACKEND_PORT=${BACKEND_PORT:-5001} tsx server/index.ts & PORT=${PORT:-5000} next dev --port ${PORT:-5000} --hostname 0.0.0.0
```
This starts both the Express API server (default port 5001) and Next.js dev server (default port 5000) concurrently. Both ports are configurable via environment variables (`PORT` and `BACKEND_PORT`). See `.env.example` for configuration.

## Known Development Issues

### Hydration Warning in Dev Mode (RESOLVED)
The Replit webview injects DOM elements before React hydrates, which can cause a "Hydration failed" error overlay. This is purely environmental (not a code bug).

**Fix in place (multi-layer):**
1. **Next.js node_modules patches** (primary fix) — `scripts/patch-next-hydration.js` patches 8 files across Next.js internals to skip hydration/mismatch errors at every error pathway:
   - `on-recoverable-error.js` (CJS + ESM) — React's recoverable error handler
   - `error-boundary-callbacks.js` (CJS + ESM) — `onCaughtError` + `onUncaughtError`
   - `use-error-handler.js` (CJS + ESM) — `handleClientError`, `onUnhandledError`, `onUnhandledRejection`
   - `intercept-console-error.js` (CJS + ESM) — patched `console.error` interceptor
   Run `node scripts/patch-next-hydration.js` after any `npm install` to re-apply.
2. **Layout inline script** (`layout.tsx`) — patches `window.reportError`, `console.error`, error events, and MutationObserver for `NEXTJS-PORTAL` removal (secondary defense)
3. **Config** — `reactStrictMode: false`, `suppressHydrationWarning` on `<html>`, `<head>`, `<body>`, `<div id="app-root">`
4. **ClientApp mounted guard** — returns `null` until client-side `useEffect` fires
5. **global-error.tsx** — catches and auto-resets hydration errors at error boundary level

### Tiptap RichTextEditor "Invalid hook call" (RESOLVED)
The `@tiptap/react` package's `useEditor` hook caused "Invalid hook call" errors under Turbopack due to module resolution creating duplicate React instances. Root cause: Turbopack bundles tiptap's internal React imports as a separate copy from the app's React. Fixed by:
1. **Replaced tiptap with a native contenteditable-based rich text editor** (`src/components/rich-text-editor.tsx`) — uses `document.execCommand` for formatting, zero third-party hook dependencies
2. Direct import (no `React.lazy()` or `Suspense` needed) — eliminates code-splitting as a failure vector
3. Editor supports: bold, italic, underline, H1-H3, bullet/ordered lists, blockquote, links, undo/redo, and HTML mode toggle
4. `transpilePackages: []` in `next.config.mjs` (cleared to prevent Turbopack from recompiling third-party packages)
5. `global-error.tsx` defensively checks `typeof reset === "function"` before calling it
6. Note: `@tiptap/*` packages remain installed but are NOT imported anywhere — can be safely removed from package.json if desired

## Multi-Tenancy
- **Tenants table** in Prisma schema with id, name, domainName, subDomain, createdAt
- **Tenant management page** at `/tenants` (super admin only) — list tenants, create new, view, delete
- **tenantId column** added to ALL tables (except Tenants and Sessions) — nullable `String?` mapped to `tenant_id`
- **Automatic tenant filtering** via Prisma Client Extensions (`server/db.ts`):
  - `getTenantPrisma(tenantId)` returns an extended Prisma client that automatically adds `tenantId` to all `findMany`, `findFirst`, `create`, `createMany`, `updateMany`, `deleteMany`, `count`, and `aggregate` operations
  - When `tenantId` is `null` (super admin / global platform), queries filter by `tenantId IS NULL` — NOT unscoped. This prevents cross-tenant data leakage when the global platform operates
  - `findUnique`, `update`, `delete` pass through unfiltered (they use unique IDs obtained from scoped queries)
  - Models excluded from filtering: `tenants`, `sessions`
- **Composite unique constraints**: Tables with slug/name/email unique constraints use composite `(column, tenant_id)` uniqueness so each tenant can have its own slugs/names. SQL migrations in `ensureTablesExist()` auto-convert old single-column uniques to composite. Affected: article_categories, event_categories, review_categories, articles, events, groups, member_reviews, podcasts, polls, subscription_plans, newsletter_subscriptions, profile_field_definitions
- **AsyncLocalStorage** (`tenantContext` in `server/db.ts`) stores the current tenant per-request
  - Auth middlewares (`isAuthenticated`, `isAdmin`, `optionalAuth`, `adminOnly`) resolve `tenantId` from the user and call `tenantContext.run()` to set the context for all downstream handlers
  - Domain resolution middleware on `/api` resolves tenant from request hostname/subdomain for unauthenticated requests
  - The `DatabaseStorage` class uses a `get db()` getter that calls `getTenantPrisma(getCurrentTenantId())` — no changes needed in route handlers
- **User tenant assignment**: Users get `tenantId` assigned on signup (from domain resolution) or when created by admin (inherits admin's tenantId). Tenant admin creation sets `tenantId` to the new tenant's id
- **Super admin** users (paul.morgan@12yards.app) have `tenantId: null` and see all data across tenants
- **Admin user list** filters by tenant context (not just for non-super-admins)
- **Tenant-aware navigation**: `TenantLink` component (`src/components/tenant-link.tsx`) wraps Next.js `Link` to preserve `_tenantId` query param across page navigation. `useTenantRouter` hook (`src/hooks/use-tenant-router.ts`) wraps `useRouter` to preserve `_tenantId` in `push`/`replace` calls. Helper: `tenantHref()` in `src/lib/tenant-link.ts`
- **Tenant creation defaults**: New tenants auto-seed hero settings (title=tenant name, subtitle placeholder), site settings (platformName=tenant name, tagline placeholder), and single "Default Category" for article/event/review categories
- **Brand colours**: Site settings include `primaryColor` and `secondaryColor` (hex strings, e.g. `#1a8fc4`). The `DynamicTheme` component (`src/components/dynamic-theme.tsx`) converts hex to HSL and overrides CSS custom properties (`--primary`, `--secondary`, `--ring`, etc.) at runtime. Each tenant can have its own brand colours. Reset to Default clears to CSS defaults.
- **Onboarding API endpoint**: `POST /api/onboarding/tenant` — public endpoint for external onboarding flows to create tenants programmatically. Secured by `ONBOARDING_API_KEY` env var (sent via `x-api-key` header or `Authorization: Bearer` header). Accepts same fields as admin tenant creation (name, domainName, subDomain, adminEmail, adminPassword, adminName). Creates tenant + admin user + hero settings + site settings + default categories in a single transaction. Returns `{ success, tenant, admin }`. Validates duplicate emails and tenant names.

## Admin Credentials
- Email: `paul.morgan@12yards.app`
- Password: `2026Vibe!!!`
- The `seedAdminUser()` function always resets the admin password on startup.
