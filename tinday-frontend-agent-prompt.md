# Tinday Frontend — AI Agent Implementation Prompt

> **Purpose:** This document is a complete implementation guide for an AI coding agent (Claude Code, Cursor, Windsurf, etc.). Follow each phase in order. Complete all checklist items before moving to the next phase. Do not skip steps.

---

## Project Context

You are building the **frontend** for **Tinday**, a swipe-based professional networking app. The UI is already fully designed on Superdesign — your job is to implement it faithfully in code.

The frontend is a **Next.js 15** application (App Router, TypeScript) that communicates with two pre-built backend services:

- **Express.js API** running at `http://localhost:4000` — handles profiles, swipes, matches, messaging, and AI proxying
- **Supabase** — used directly from the client for Realtime message subscriptions and file storage uploads

The complete API specification is in `openapi.json` at the project root. **Read `openapi.json` before implementing any API call.** It is the single source of truth for all endpoint paths, request bodies, response shapes, and error codes. Do not guess endpoint signatures — always verify against the spec.

Before implementing any page, also fetch its design from Superdesign using the skill. Every colour, font, spacing decision, and animation is specified in the fetched design. Do not guess or approximate — fetch first, then implement.

---

## Design Reference — Superdesign Project

All designs are in project `fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6`. Each phase below includes the exact fetch prompt to run before starting that phase.

---

## Design Token Summary

| Token               | Value                                      |
| ------------------- | ------------------------------------------ |
| Background          | `#0A090F` (landing), `#151515` (app pages) |
| Card background     | `#1C1829`                                  |
| Sidebar background  | `#110E1B`                                  |
| Input background    | `#161222`                                  |
| Subtle/surface      | `#221E30`                                  |
| Accent (purple)     | `#8478D4`                                  |
| Text primary        | `#FFFFFF`                                  |
| Text secondary      | `#9CA3AF`                                  |
| Text muted          | `#4B5563`                                  |
| Online green        | `#22C55E`                                  |
| Match gold          | `#F59E0B`                                  |
| Error red           | `#EF4444`                                  |
| Font display        | Playfair Display (serif)                   |
| Font body           | Inter (sans-serif)                         |
| Font mono           | JetBrains Mono                             |
| Border radius cards | `16px` / `24px` (larger cards)             |
| Card border         | `1px solid rgba(132,120,212,0.1)`          |

---

## Tech Stack

| Purpose                | Library                             |
| ---------------------- | ----------------------------------- |
| Framework              | Next.js 15 (App Router, TypeScript) |
| Styling                | Tailwind CSS v4                     |
| Component primitives   | shadcn/ui                           |
| Icons                  | Lucide React                        |
| Animations             | Framer Motion                       |
| Swipe gestures         | @use-gesture/react                  |
| Global state           | Zustand                             |
| Server state / caching | TanStack Query v5                   |
| Forms                  | React Hook Form                     |
| Validation             | Zod                                 |
| HTTP client            | Axios                               |
| Supabase client        | @supabase/supabase-js               |
| Socket.io client       | socket.io-client                    |

---

## Repository Structure

```
tinday-frontend/
├── public/
│   └── noise.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── onboarding/
│   │   │       └── page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── explore/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [chatId]/
│   │   │   │       └── page.tsx
│   │   │   ├── inbox/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [matchId]/
│   │   │   │       └── page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── SideRail.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── explore/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── CardCarousel.tsx
│   │   │   ├── SwipeActions.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── MatchOverlay.tsx
│   │   ├── chat/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── AIOrb.tsx
│   │   │   └── SharedProfileCard.tsx
│   │   ├── inbox/
│   │   │   ├── ConversationRow.tsx
│   │   │   └── TypingIndicator.tsx
│   │   └── profile/
│   │       ├── AvatarUpload.tsx
│   │       ├── SkillPills.tsx
│   │       └── StatCounter.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSwipe.ts
│   │   ├── useRealtimeMessages.ts
│   │   ├── useTypingIndicator.ts
│   │   └── usePresence.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── .env.local.example
├── next.config.ts
└── tailwind.config.ts
```

---

## Environment Variables

```bash
# Express backend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Supabase (anon key only — never the service role key)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Socket.io (same origin as Express)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## Implementation Rules

1. **Read `openapi.json` before implementing any API call.** Every endpoint path, request body field, and response shape must match the spec exactly. Never guess.
2. **Fetch the Superdesign design before starting each phase.** Use the fetch prompt at the top of each phase.
3. **Design fidelity is mandatory.** Colours, fonts, spacing, border radii, and animations must match the fetched design exactly.
4. **Never put data-fetching logic in page components.** Data fetching lives in TanStack Query hooks.
5. **Never access `localStorage` directly outside of Zustand or a dedicated utility.**
6. **All forms must use React Hook Form + Zod.**
7. **All API calls go through the Axios instance in `lib/api.ts`.** Never call `fetch` directly for backend requests except for SSE streaming.
8. **Supabase client is used only for Realtime subscriptions and Storage uploads.**
9. **Animations must use Framer Motion.**
10. **The `(auth)` route group renders no shell layout. The `(app)` route group always renders TopNav + SideRail + BottomNav.**
11. **Token refresh must be handled automatically** via Axios interceptor.
12. **Complete each phase fully before starting the next.**

---

## Phase 0 — Project Bootstrap

- [x] Scaffold: `npx create-next-app@latest tinday-frontend --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [x] Install dependencies:
  ```bash
  npm install framer-motion @use-gesture/react zustand @tanstack/react-query axios
  npm install @supabase/supabase-js socket.io-client
  npm install react-hook-form zod @hookform/resolvers
  npm install lucide-react class-variance-authority clsx tailwind-merge
  ```
- [x] Install and initialise shadcn/ui: `npx shadcn@latest init` — dark theme, CSS variables
- [x] Add shadcn components: `button`, `input`, `textarea`, `badge`, `avatar`, `dialog`, `dropdown-menu`, `tabs`, `scroll-area`, `separator`, `skeleton`, `toast`
- [x] Add Google Fonts to `src/app/layout.tsx` — Playfair Display (400, 500, 600, 700 + italic), Inter (300, 400, 500), JetBrains Mono (300, 400)
- [x] Configure `tailwind.config.ts` — extend `fontFamily` with `display`/`body`/`mono`, extend `colors` with all design tokens
- [x] Configure `globals.css` — `background-color: #151515` on `html`/`body`, CSS custom properties for all tokens, `.noise-overlay` class (fixed, `pointer-events: none`, `mix-blend-mode: overlay`, `opacity: 0.05`), `scroll-behavior: smooth`
- [x] Create `.env.local` and fill in values
- [x] Configure `next.config.ts` — add Supabase storage URL to `images.domains`
- [x] Verify: `npm run dev` starts with no errors

---

## Phase 1 — Types, Lib, and Store

### `src/types/index.ts`

Define these interfaces matching the OpenAPI schemas exactly:

```typescript
// Matches OpenAPI: User schema
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Matches OpenAPI: Session schema
export interface Session {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

// Matches OpenAPI: AuthResponse schema
// Used by POST /api/auth/login and POST /api/auth/refresh
export interface AuthResponse {
  session: Session;
  user: User;
}

// Matches OpenAPI: Profile schema (own profile — includes preferences)
export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  about: string | null;
  experience_years: number;
  skills: string[];
  roles: string[];
  projects: Project[];
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Matches OpenAPI: PublicProfile schema (other users — no preferences)
export interface PublicProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  about: string | null;
  experience_years: number;
  skills: string[];
  roles: string[];
  projects: Project[];
}

export interface Project {
  title?: string;
  description?: string;
  url?: string;
  media_url?: string;
  [key: string]: unknown; // schema is flexible per OpenAPI spec
}

// Matches OpenAPI: SwipeResponse schema
export interface SwipeResponse {
  swipe: {
    id: string;
    giver_id: string;
    receiver_id: string;
    direction: "RIGHT" | "LEFT";
    created_at: string;
  };
  match: {
    id: string;
    user_a_id: string;
    user_b_id: string;
    created_at: string;
  } | null; // null when no mutual match
}

// Matches OpenAPI: MatchWithUser schema
// Returned by GET /api/matches
export interface MatchWithUser {
  match_id: string; // note: match_id not id
  created_at: string;
  user: PublicProfile; // note: single user field, not user_a/user_b
}

// Matches OpenAPI: Message schema
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// Matches OpenAPI: InboxEntry schema
// Returned by GET /api/messaging/inbox
export interface InboxEntry {
  match_id: string;
  other_user: PublicProfile;
  latest_message: {
    id: string;
    sender_id: string;
    content: string;
    read_at: string | null;
    created_at: string;
  } | null;
  unread_count: number;
  last_activity: string;
}

// Matches OpenAPI: PaginatedProfiles schema
export interface PaginatedProfiles {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
}

// Matches OpenAPI: ChatRequest schema
// Note: role is "user" | "model" | "system" — NOT "assistant"
export interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
}

// Matches OpenAPI: ProfileAnalysis schema
// Returned by POST /api/ai/share-profile
export interface ProfileAnalysis {
  analysis: string;
}

// Local-only type for AI conversation state
export interface AIConversation {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}
```

### `src/lib/supabase.ts`

- [x] Create and export a single Supabase client instance using `createClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Export `setSupabaseSession(access_token: string, refresh_token: string)` — calls `supabase.auth.setSession({ access_token, refresh_token })`

### `src/lib/api.ts`

- [x] Create Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL`
- [x] **Request interceptor:** reads `access_token` from Zustand auth store, attaches as `Authorization: Bearer <token>`
- [x] **Response interceptor:**
  - On 401: reads `refresh_token` from store, calls `POST /api/auth/refresh` with body `{ refresh_token }`, reads new tokens from `response.data.session.access_token` and `response.data.session.refresh_token`, updates store, retries original request once
  - On retry failure: calls `authStore.logout()`, redirects to `/login`
- [x] Export typed wrappers: `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.delete<T>` that unwrap `response.data`
- [x] Throw clear error on startup if `NEXT_PUBLIC_API_URL` is missing

### `src/lib/socket.ts`

- [x] Socket.io client singleton, `NEXT_PUBLIC_SOCKET_URL`, `autoConnect: false`
- [x] `auth` callback reads `access_token` from Zustand store
- [x] Export `connectSocket()` and `disconnectSocket()`

### `src/lib/utils.ts`

- [x] `cn(...inputs)` via `clsx` + `tailwind-merge`
- [x] `formatRelativeTime(date: string): string` — "2m ago", "1h ago", "Yesterday", "3 days"
- [x] `getInitials(name: string): string` — "SC" for "Sarah Chen"
- [x] `buildProfileText(profile: Profile): string` — `about + skills.join(', ') + roles.join(', ')`

### `src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  profile: Profile | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { user: User; session: Session }) => void; // tokens inside session
  setProfile: (profile: Profile) => void;
  logout: () => void;
}
```

- [x] `setAuth` extracts `session.access_token` and `session.refresh_token` from the payload — matches the `AuthResponse` shape from the API
- [x] Wrap with `persist` middleware, key `tinday-auth`, `localStorage`
- [x] `logout()` clears store, calls `supabase.auth.signOut()`, calls `disconnectSocket()`, redirects to `/login`

### `src/store/uiStore.ts`

```typescript
interface UIState {
  notificationPanelOpen: boolean;
  matchOverlayData: SwipeResponse["match"] | null;
  activeConversationId: string | null;
  setNotificationPanel: (open: boolean) => void;
  showMatchOverlay: (match: NonNullable<SwipeResponse["match"]>) => void;
  closeMatchOverlay: () => void;
  setActiveConversation: (id: string | null) => void;
}
```

- [x] Not persisted

### `src/app/layout.tsx` (Root)

- [x] Wrap with `TanStackQueryProvider` (`staleTime: 1000 * 60 * 5`), `Toaster`, `NoiseOverlay`
- [x] Apply font variables to `<html>`

---

## Phase 2 — Landing Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Landing Page — Purple Atmosphere Hero (draft-id: c7fdd294-5c8e-4dd4-8c37-21d1d1db3841)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

- [x] `src/app/page.tsx` — server component
- [x] Noise overlay, fixed, `z-index: 9999`
- [x] **Nav bar** — transparent → `rgba(21,21,21,0.85)` + `backdrop-filter: blur(20px)` on scroll. Wordmark, center links, "Get Started" pill (white bg, black text)
- [x] **Hero** — full viewport, `radial-gradient(ellipse at bottom, #1B1535 0%, #090A0F 100%)`:
  - Three star layers as `div` elements with `box-shadow` star fields, Framer Motion vertical scroll animation
  - Bottom fade gradient
  - Eyebrow badge — purple border/bg pill, uppercase tracking
  - H1 with word-cycling component (Developer → Designer → Manager → Founder → Marketer), Playfair Display italic, Framer Motion `AnimatePresence` 2s cycle
  - Subtext, "Start Swiping" glass morphism CTA
  - Live clock `Asia/Karachi` timezone + `· Lahore, PK` — JetBrains Mono
  - Scroll indicator
- [x] **Feature cards section** — dot grid bg, two rotated cards. Card 1: purple bg `rotate(-6deg)`. Card 2: dark bg `rotate(6deg)`. Hover → `rotate(0deg)`. Scroll sway via `useScroll` + `useTransform`
- [x] **Social proof** — 5 logos (Notion, Figma, GitHub, Linear, Vercel), SVG, grayscale 40% → full colour on hover
- [x] **Footer** — giant faded wordmark `clamp(100px, 14vw, 180px)`, `rgba(132,120,212,0.07)`. Lucide social icons
- [x] Hero parallax via `useScroll` + `useTransform`. Scroll reveal via `whileInView` `viewport={{ once: true }}`

---

## Phase 3 — Auth Pages

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Sign In / Sign Up — Purple Mauve Theme (draft-id: b21e097f-eda9-4f84-8820-f4f566aae2aa)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### Login — `src/app/(auth)/login/page.tsx`

- [x] Dark bg, two ambient purple glows, noise overlay
- [x] Card: `max-w-[440px]`, `background: #1C1829`, `border: 1px solid rgba(132,120,212,0.12)`, `border-radius: 16px`, `padding: 40px`
- [x] "Tinday." wordmark centered (Playfair Display)
- [x] Tab switcher: pill container `background: #221E30`, sliding `motion.div` with `layout` prop. "Sign Up" tab navigates to `/register`
- [x] Email input, password input with show/hide toggle (Lucide `Eye`/`EyeOff`), "Forgot password?" link, "Sign In" button `background: #8478D4`
- [x] Divider, three social buttons (Google/GitHub/Apple SVGs) — "Social auth coming soon" toast on click
- [x] **Form submission:**
  - Zod: `{ email: z.string().email(), password: z.string().min(8) }`
  - `POST /api/auth/login` body: `{ email, password }`
  - Response shape: `{ session: { access_token, refresh_token, expires_in, expires_at, ... }, user }` — extract tokens from `response.session`
  - On success: `authStore.setAuth({ user: response.user, session: response.session })`, `setSupabaseSession(session.access_token, session.refresh_token)`, `connectSocket()`, redirect `/explore`
  - Error: `motion.div` `initial={{ opacity: 0, y: -4 }}` entrance below button

### Register — `src/app/(auth)/register/page.tsx`

- [x] Same card layout
- [x] Full Name, Email, Password (with 4-segment strength meter: red → amber → green), Confirm Password
- [x] **Form submission:**
  - Zod: `{ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), confirmPassword: z.string() }` with `.refine()` for password match
  - `POST /api/auth/register` body: `{ email, password, name }`
  - Response: `{ message: string, user: User }` — status 201, **no tokens returned**
  - After register: automatically call `POST /api/auth/login` with same credentials to get tokens
  - Then `authStore.setAuth(...)`, `setSupabaseSession(...)`, `connectSocket()`, redirect to `/onboarding`
  - Display field-level errors from `response.details[]` array

### Onboarding — `src/app/(auth)/onboarding/page.tsx`

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Onboarding Flow — Purple Mauve Theme (draft-id: b15c9c94-0dca-483a-b970-37fa57d3d6cd)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

- [x] Route guard: if `!isAuthenticated` → `/login`. If `profile.skills.length > 0` → `/explore`
- [x] 4 progress dots — active expands to `width: 20px`, Framer Motion `layout`
- [x] Back button from step 2 onwards
- [x] Step transitions: `AnimatePresence` `mode="wait"`, forward `x: 40 → 0`, backward `x: -40 → 0`
- [x] **Step 1:** avatar upload (circular dashed border, camera icon, file preview on select), Full Name, Your Role
- [x] **Step 2:** textarea "About you", experience pills single-select
- [x] **Step 3:** skills input (Enter to add pill), selected skills with `×` remove, suggested skills, roles section same pattern
- [x] **Step 4:** preferred roles multi-select, skills looking for multi-select, experience level single-select
- [x] **On "Complete Profile":**
  - `PUT /api/profiles/me` body: `{ name, about, experience_years, skills, roles, preferences }` — all optional fields, send what was collected
  - If avatar selected: `POST /api/profiles/me/photo` — send **raw binary** with `Content-Type: image/jpeg` (or appropriate mime type). Do NOT use FormData. Read the file as ArrayBuffer and send directly
  - On success: show celebration overlay
- [x] **Celebration overlay:** confetti (60 `motion.div`), profile card preview with collected data, "Start Exploring" → `/explore`

---

## Phase 4 — App Shell Layout

### `src/app/(app)/layout.tsx`

- [x] Client component, reads auth store, route guard `->` `/login`
- [x] Renders `<TopNav />`, `<SideRail />` (desktop), `<main>` fixed `top: 60px left: 64px` (desktop) / `left: 0` (mobile), `<BottomNav />` (mobile)

### `src/components/layout/TopNav.tsx`

- [x] Fixed, `height: 60px`, `background: #151515`, `border-bottom: 1px solid rgba(132,120,212,0.08)`
- [x] Left: "Tinday." `margin-left: 72px` desktop. Center: search input `background: #221E30` hidden on mobile. Right: bell badge + avatar
- [x] Notification panel: `motion.div` slide down, `fixed top: 60px right: 40px width: 400px`, close on outside click. Notification rows matching fetched design

### `src/components/layout/SideRail.tsx`

- [x] Fixed, `width: 64px`, `background: #110E1B`, `border-right: 1px solid rgba(132,120,212,0.08)`
- [x] 4 icon buttons, `width/height: 40px`, `border-radius: 12px`
- [x] Active: `background: rgba(132,120,212,0.12)`, `2px × 20px` left edge bar, accent icon
- [x] CSS hover tooltips, `usePathname()` for active route

### `src/components/layout/BottomNav.tsx`

- [x] `md:hidden`, fixed bottom, `height: 60px`, 4 items, active: accent + top `2px` bar, `usePathname()`

---

## Phase 5 — Explore Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Explore Page — Warm Nebula Theme (draft-id: d6f3456a-10c9-41c2-a64c-773917bb4697)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### Data hooks

- [ ] **`useExploreFeed`** — `GET /api/explore` with optional query params `skills`, `min_experience`, `max_experience`, `limit`. Returns `PublicProfile[]`. `staleTime: 0`
- [ ] **`useRecordSwipe`** — mutation `POST /api/swipes` body `{ receiver_id: string, direction: 'RIGHT' | 'LEFT' }`. Response is `SwipeResponse` — check `response.match !== null` to determine if a match was created. On match: `uiStore.showMatchOverlay(response.match)`

### `src/components/explore/FilterBar.tsx`

- [ ] Scrollable pill row. Pills: "All", "Design", "Engineering", "Product", "1-3 yrs", "3-5 yrs", "5+ yrs", "Filter" (sliders icon). Single-select, active = accent border/bg. State lifted to page, passed as query params to `useExploreFeed`

### `src/components/explore/ProfileCard.tsx`

- [ ] `motion.div`, `256px × 384px`, `border-radius: 24px`
- [ ] Gradient background cycling by index, bottom `55%` gradient overlay
- [ ] Content: experience badge top-right (blurred dark pill), share icon top-left, skill pills (max 3), location, role, name
- [ ] `"CONNECTED"` (green left) and `"PASSED"` (red right) swipe badge overlays, `opacity: 0` default

### `src/components/explore/CardCarousel.tsx`

- [ ] `perspective: 1000px` container, 5-card positions (left-2, left-1, center, right-1, right-2)
- [ ] Center: `scale(1)`, full opacity, no blur. Left/Right-1: `scale(0.85)`, 40% opacity, 4px blur, rotateY. Left/Right-2: invisible
- [ ] Framer Motion `layout` + spring. Chevron buttons, mousewheel navigation, 4s auto-advance (pauses on hover)

### `src/hooks/useSwipe.ts`

- [ ] `@use-gesture/react` `useDrag` on center card
- [ ] Drag: `translateX` + `rotate`, badge opacity proportional to progress, green/red glow
- [ ] Release > threshold (`window.innerWidth * 0.12`): fly off, `useRecordSwipe` fires, carousel advances. Below threshold: spring back

### `src/components/explore/SwipeActions.tsx`

- [ ] Pass (X, `52px`), Star (gold, `44px`), Connect (accent, `60px`). Framer Motion `whileHover`/`whileTap`
- [ ] Toast: `"Connected with [Name]!"` (green) or `"Passed on [Name]"` (red), 1.8s auto-dismiss

### `src/components/explore/MatchOverlay.tsx`

- [ ] Reads `matchOverlayData` from `uiStore`. Dark backdrop, `AnimatePresence`
- [ ] Two avatars + SVG curved line animated via `pathLength`. Traveling pulse `<circle>` via `animateMotion`
- [ ] "It's a Match!" Playfair italic. "Send Message" → `/inbox/[match.id]`. "Keep Exploring" closes overlay
- [ ] 80 confetti `motion.div`s, accent palette, removed after 2.5s. Auto-close 6s

### Explore page assembly

- [ ] Compose all components. When queue < 3, refetch. Skeleton cards while loading

---

## Phase 6 — AI Chat Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday AI Chat Page — Warm Nebula Theme (draft-id: 2f026ef6-5b32-464b-87ff-c206d73a9013)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### Data hooks

- [ ] **`useAIConversations`** — reads from `localStorage`, returns `AIConversation[]`
- [ ] **`useSendAIMessage`** — sends `POST /api/ai/chat` body `{ message: string, conversation_history: ChatMessage[] }`. Note: `conversation_history` roles must be `"user"` or `"model"` (not `"assistant"`). Handles SSE streaming

### `src/app/(app)/chat/page.tsx`

- [ ] Left sidebar `width: 280px`, `background: #110E1B`: conversation rows (AI orb, title, timestamp, preview), "New Chat" button

### `src/app/(app)/chat/[chatId]/page.tsx`

- [ ] Chat top bar: `AIOrb` + "Tinday AI" + "Active now" green dot + kebab
- [ ] Messages: user right-aligned (`background: rgba(132,120,212,0.18)`), AI left-aligned (`background: #221E30`). Staggered Framer Motion entrance
- [ ] Inline `SharedProfileCard` when AI references a profile

### `src/components/chat/AIOrb.tsx`

- [ ] `24px` container, `12px` accent dot, two concentric rings pulsing scale `1→1.15` opacity `1→0.3` 1.5s infinite. `isThinking`: faster. `isIdle`: static `opacity: 0.4`

### `src/components/chat/SharedProfileCard.tsx`

- [ ] `background: #1C1829`, flex row, `padding: 12px`, `border-radius: 12px`
- [ ] Avatar + name/role/skill pills + "View Profile" → `/profile/[userId]`
- [ ] `POST /api/ai/share-profile` body `{ profile_id }` returns `{ analysis: string }` — display analysis below the card
- [ ] `motion.div` `initial={{ scale: 0.95, opacity: 0 }}` entrance

### Streaming SSE

- [ ] Use browser `fetch` (not Axios) for `POST /api/ai/chat`
- [ ] Set `Authorization: Bearer <token>` header manually (read from auth store)
- [ ] Read stream via `response.body.getReader()` + `TextDecoder`
- [ ] Each `data: <chunk>\n\n` event appends to local `streamingContent` state
- [ ] On stream end: push complete `{ role: 'model', content }` message to `localStorage` history

### `src/components/chat/ChatInput.tsx`

- [ ] Sticky bottom, `background: #161222`. Paperclip button (toast). Auto-growing textarea `max-height: 120px` `background: #221E30`. Send button inactive `#2a2a2a` → active `#8478D4`. Enter sends, Shift+Enter newline

---

## Phase 7 — Inbox Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Inbox Page — Warm Nebula Theme (draft-id: 3294c415-f01b-4d52-b34b-96520ec7ceec)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### Data hooks

- [ ] **`useInbox`** — `GET /api/messaging/inbox`. Returns `InboxEntry[]` sorted by `last_activity` desc. Each entry has `match_id`, `other_user`, `latest_message`, `unread_count`, `last_activity`. `refetchInterval: 30000`
- [ ] **`useMessages`** — `GET /api/messaging/matches/{matchId}/messages?from=0&to=49`. Returns `Message[]` ordered ascending. Enabled only when `matchId` defined. Supports pagination via `from`/`to` query params
- [ ] **`useSendMessage`** — `POST /api/messaging/matches/{matchId}/messages` body `{ content: string }`. Optimistic update via `queryClient.setQueryData`
- [ ] **`useMatches`** — `GET /api/matches`. Returns `MatchWithUser[]` — each has `match_id`, `created_at`, `user` (the other user's `PublicProfile`)

### `src/hooks/useRealtimeMessages.ts`

- [ ] Accepts `matchId: string | null`, unsubscribes on change
- [ ] Supabase Realtime:
  ```typescript
  supabase
    .channel(`match-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        queryClient.setQueryData(["messages", matchId], (old: Message[]) => [
          ...(old ?? []),
          payload.new as Message,
        ]);
      },
    )
    .subscribe();
  ```

### `src/hooks/useTypingIndicator.ts`

- [ ] Returns `{ isPartnerTyping, sendTypingStart, sendTypingStop }`
- [ ] Emits `typing_start`/`typing_stop` to Socket.io with `matchId`, debounced 2s
- [ ] Listens for `user_typing`/`user_stopped_typing`, auto-resets after 3s failsafe

### `src/app/(app)/inbox/page.tsx`

- [ ] Left panel `width: 340px`, `background: #110E1B`: "Messages" header + compose icon + search + conversation rows from `useInbox`
- [ ] Right panel: empty state when no match selected. Mobile: full width list, tap navigates to `/inbox/[matchId]`

### `src/app/(app)/inbox/[matchId]/page.tsx`

- [ ] Left panel (list, active row highlighted) + right panel (thread)
- [ ] Thread top bar: other user avatar + online dot + name + role
- [ ] Messages from `useMessages` + real-time from `useRealtimeMessages`
- [ ] Last sent message: read receipt (`CheckCheck` accent + "Seen"), Framer Motion fade-in
- [ ] `TypingIndicator` when `isPartnerTyping`

### `src/components/inbox/ConversationRow.tsx`

- [ ] `height: 72px`, avatar `44px` with online dot, name/preview/timestamp, unread count badge (accent pill, spring entrance)
- [ ] Active: `background: rgba(132,120,212,0.06)`, `border-left: 2px solid #8478D4`

### `src/hooks/usePresence.ts`

- [ ] Listens to `user_offline` Socket.io. Maintains `Set<string>` offline IDs. Exports `isOnline(userId: string): boolean`

---

## Phase 8 — Profile Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Profile Page — Near-Black Rail Update (draft-id: 72b7e89a-d426-4f19-a8da-a63196171af0)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### Data hooks

- [ ] **`useOwnProfile`** — `GET /api/profiles/me`. Returns full `Profile` (with `preferences`). Syncs into `authStore.setProfile()`
- [ ] **`usePublicProfile(userId)`** — `GET /api/profiles/{userId}`. Returns `PublicProfile` (no `preferences`)
- [ ] **`useUpdateProfile`** — `PUT /api/profiles/me` body is partial `UpdateProfileRequest`: any of `{ name, about, experience_years, skills, roles, projects, preferences }`. Returns updated `Profile`. Invalidates `['profile', 'me']`
- [ ] **`useUploadAvatar`** — `POST /api/profiles/me/photo`. **Send raw binary** — read file as `ArrayBuffer`, set `Content-Type` to the file's MIME type (e.g. `image/jpeg`). Do NOT use `FormData`. Returns updated `Profile` with new `avatar_url`
- [ ] **`useSearchProfiles`** — `GET /api/profiles/search?skills=&min_experience=&max_experience=&page=&limit=`. Returns `PaginatedProfiles`

### `src/app/(app)/profile/page.tsx`

- [ ] Cover `height: 200px`, gradient + radial purple glow. Parallax via `useScroll` + `useTransform` (30% speed)
- [ ] Avatar `96px`, `border: 3px solid #8478D4`, overlaps cover `-48px`. Camera badge triggers file input
- [ ] Identity: name (Playfair Display `28px`), role, location — staggered Framer Motion fade-up
- [ ] Action row: "Edit Profile" (outline) + "Share Profile" (accent outline)
- [ ] Stats row: Connections (from `profile` — derive from matches count), Matches, Profile Views — count-up animation 800ms ease-out cubic on mount
- [ ] **Content cards** (`background: #1C1829`, `border: 1px solid rgba(132,120,212,0.1)`, `border-radius: 16px`):
  - About, Skills (accent pills), Roles (muted pills), Experience (large number), Projects (2×2 grid, hover expand), Looking For (preference pills)
  - Each: pencil icon turns accent on hover
- [ ] Settings links bottom: "Account & Settings", "Log Out" (red) → `authStore.logout()`
- [ ] Cards `whileInView={{ opacity: 1, y: 0 }}` from `{ opacity: 0, y: 20 }`, `viewport={{ once: true }}`, staggered 100ms

### `src/app/(app)/profile/[userId]/page.tsx`

- [ ] Same layout, read-only. `GET /api/profiles/{userId}` — returns `PublicProfile`
- [ ] Action row: "Connect" button (`POST /api/swipes` with `direction: 'RIGHT'`), "Message" (if already matched)

### `src/components/profile/AvatarUpload.tsx`

- [ ] `currentUrl`, `onUpload(file: File)` callback. Validates image, max 5MB. Upload progress bar

### `src/components/profile/StatCounter.tsx`

- [ ] `value: number`, `label: string`. Count-up via `requestAnimationFrame`, 800ms ease-out cubic

---

## Phase 9 — Settings Page

**Fetch design before starting:**

```
Please fetch design below using Superdesign skill and create an implementation plan into our codebase:

Project ID: fc6473ba-90e7-4dc3-bdcd-0bfa60f1dde6
- Tinday Settings Page — Warm Nebula Theme (draft-id: 43d9ad90-c856-4741-9b3c-7703dcee59cc)

(if no skill added yet, read from https://raw.githubusercontent.com/superdesigndev/superdesign-skill/refs/heads/main/skills/superdesign/SKILL.md)
```

### `src/app/(app)/settings/page.tsx`

- [ ] Back nav `height: 44px`, "← Profile" with Lucide `ArrowLeft`
- [ ] Grouped card rows: `background: #1C1829`, `border-radius: 12px`, `border-bottom: 1px solid rgba(255,255,255,0.05)` between rows. Hover `rgba(132,120,212,0.03)`
- [ ] **Account:** Connected Accounts (Google/GitHub/Apple SVGs + green "Connected" `CheckCircle2`), Email (from `authStore.user.email`), Username
- [ ] **Privacy:** Who can see profile (display-only), Allow AI recommendations toggle, Show online status toggle
- [ ] **Notifications:** New match (on), New message (on), AI recommendations (off), Profile views (on)
- [ ] **Appearance:** Theme ("Dark" + `Lock` icon + hover tooltip "Dark mode always on"), Reduce motion toggle
- [ ] **Toggle:** `44px × 24px`, track `#2a2a2a` → active `#8478D4`, thumb Framer Motion `animate` `x: 0 → 20`, `useState`
- [ ] **Danger Zone:** red label, Delete Account row (`rgba(239,68,68,0.05)` bg). Click → shadcn `Dialog` confirmation
- [ ] **Logout:** calls `POST /api/auth/logout` then `authStore.logout()`
- [ ] Version: `"Tinday v1.0.0 · Made with ❤️"`
- [ ] Toggle state persisted to `localStorage`. Sections: `whileInView` staggered animation

---

## Phase 10 — Polish and Final Checks

- [ ] **Responsive:** test at `375px`, `768px`, `1280px`
- [ ] **`next/image`:** replace all `<img>` with `<Image>`, `priority` on above-fold images
- [ ] **`loading.tsx`:** each `(app)` route — skeleton matching page layout
- [ ] **`error.tsx`:** `(app)` route group catch-all — styled error card with retry
- [ ] **`not-found.tsx`:** dark 404, link to `/explore`
- [ ] **Empty states:** Explore (no profiles), Inbox (no matches), Chat (no conversations)
- [ ] **Error states:** all data-fetching pages show styled error + retry on failure
- [ ] **Token expiry:** expire manually, confirm Axios interceptor refreshes transparently
- [ ] **Socket lifecycle:** login → connect, logout → disconnect, navigation → stays connected
- [ ] **Realtime:** two tabs as matched users — message appears in <1s via Supabase Realtime
- [ ] **Accessibility:** `focus-visible:ring-2 focus-visible:ring-accent`, `alt` on all images, `aria-label` on icon buttons
- [ ] **Framer Motion:** `will-change-transform` on carousel cards, `layout={false}` where layout animation not needed
- [ ] **Build check:** `npm run build` — zero TypeScript errors and ESLint warnings

---

## Appendix — Complete API Reference

> **Always verify against `openapi.json` at project root before implementing any call.**

### Auth — Rate limited: 10 req/min per IP

| Method | Path                 | Auth   | Request Body                | Response                                                                     |
| ------ | -------------------- | ------ | --------------------------- | ---------------------------------------------------------------------------- |
| `POST` | `/api/auth/register` | None   | `{ email, password, name }` | `201 { message, user }` — no tokens                                          |
| `POST` | `/api/auth/login`    | None   | `{ email, password }`       | `{ session: { access_token, refresh_token, expires_in, expires_at }, user }` |
| `POST` | `/api/auth/refresh`  | None   | `{ refresh_token }`         | `{ session: { access_token, refresh_token, ... }, user }`                    |
| `POST` | `/api/auth/logout`   | Bearer | None                        | `{ message }`                                                                |
| `GET`  | `/api/auth/me`       | Bearer | —                           | Full `Profile`                                                               |

### Profiles

| Method | Path                              | Auth   | Request Body / Params                                                                    | Response                             |
| ------ | --------------------------------- | ------ | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| `GET`  | `/api/profiles/me`                | Bearer | —                                                                                        | Full `Profile` (with `preferences`)  |
| `PUT`  | `/api/profiles/me`                | Bearer | Partial `{ name?, about?, experience_years?, skills?, roles?, projects?, preferences? }` | Updated `Profile`                    |
| `POST` | `/api/profiles/me/photo`          | Bearer | Raw binary, `Content-Type: image/*`, max 5MB                                             | Updated `Profile`                    |
| `POST` | `/api/profiles/me/projects/media` | Bearer | Raw binary, `Content-Type: image/*` or `video/*`, max 10MB                               | `{ url: string }`                    |
| `GET`  | `/api/profiles/search`            | Bearer | Query: `skills?`, `min_experience?`, `max_experience?`, `page?` (1-based), `limit?`      | `{ profiles[], total, page, limit }` |
| `GET`  | `/api/profiles/{userId}`          | Bearer | —                                                                                        | `PublicProfile` (no `preferences`)   |

### Swipes

| Method | Path          | Auth   | Request Body                                    | Response                                 |
| ------ | ------------- | ------ | ----------------------------------------------- | ---------------------------------------- |
| `POST` | `/api/swipes` | Bearer | `{ receiver_id, direction: 'RIGHT' \| 'LEFT' }` | `{ swipe: {...}, match: {...} \| null }` |

### Matches

| Method | Path           | Auth   | Response                                               |
| ------ | -------------- | ------ | ------------------------------------------------------ |
| `GET`  | `/api/matches` | Bearer | `Array<{ match_id, created_at, user: PublicProfile }>` |

### Messaging ⚠️ Note the `/api/messaging/` prefix

| Method | Path                                        | Auth   | Request / Params                                                 | Response                                                                                                                             |
| ------ | ------------------------------------------- | ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/messaging/inbox`                      | Bearer | —                                                                | `InboxEntry[]` sorted by `last_activity` desc — each has `match_id`, `other_user`, `latest_message`, `unread_count`, `last_activity` |
| `GET`  | `/api/messaging/matches/{matchId}/messages` | Bearer | Query: `from?` (0-based, default 0), `to?` (0-based, default 49) | `Message[]` ordered ascending                                                                                                        |
| `POST` | `/api/messaging/matches/{matchId}/messages` | Bearer | `{ content: string }`                                            | Created `Message` (status 201)                                                                                                       |

### Explore

| Method | Path           | Auth   | Query Params                                                           | Response                    |
| ------ | -------------- | ------ | ---------------------------------------------------------------------- | --------------------------- |
| `GET`  | `/api/explore` | Bearer | `skills?`, `min_experience?`, `max_experience?`, `limit?` (default 20) | `PublicProfile[]` AI-ranked |

### AI

| Method | Path                    | Auth   | Request Body                                                                                                 | Response                                                    |
| ------ | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `GET`  | `/api/ai/recommend`     | Bearer | Query: `skills?`, `min_experience?`, `max_experience?`, `limit?`                                             | `PublicProfile[]` AI-ranked                                 |
| `POST` | `/api/ai/chat`          | Bearer | `{ message: string, conversation_history: Array<{ role: 'user' \| 'model' \| 'system', content: string }> }` | SSE stream `text/event-stream`, format: `data: <chunk>\n\n` |
| `POST` | `/api/ai/share-profile` | Bearer | `{ profile_id: string }`                                                                                     | `{ analysis: string }` — regular JSON, not streaming        |

### Health

| Method | Path      | Auth | Response                                          |
| ------ | --------- | ---- | ------------------------------------------------- |
| `GET`  | `/health` | None | `{ status: 'ok', timestamp, service: 'express' }` |

### Error Response Format

All errors follow this shape:

```typescript
{
  error: string           // always present
  message?: string        // additional context
  details?: Array<{       // 422 only — field-level validation errors
    field: string
    message: string
  }>
}
```

### Rate Limits

- **Global:** 100 requests/minute per IP
- **Auth endpoints** (`/api/auth/*`): 10 requests/minute per IP — handle `429` responses gracefully
