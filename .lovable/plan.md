# DevForge — Build Plan

A social portfolio platform for interns with three roles (Intern, HR, Admin), built on Lovable Cloud (auth, database, storage) and Lovable AI (description improvement, chat assistant).

The PRD is large, so this is staged across multiple iterations. After each stage you'll see working pages in the preview and can request changes before moving on.

## Design System (applied globally first)

- Dark theme: pure black (#000) base, layered blacks (#0A0A0A, #111, #1A1A1A)
- Violet primary (#8B5CF6), dark (#6D28D9), light (#A78BFA)
- Glassmorphism cards (blur + violet border)
- Violet gradient buttons with glow on hover
- Inter font, Fira Code for code
- Status colors: success/warning/error/info as specified
- All tokens in `index.css` + `tailwind.config.ts` (HSL semantic tokens)

## Stage 1 — Foundation, Landing, Auth, Roles

**Landing page (`/`)**
- Sticky glass nav with logo, menu, Sign In / Join CTAs
- Hero with animated violet orb, headline, stats bar (500+ interns etc.)
- Features grid (6 cards), How It Works (4 steps), Project Showcase (3 cards), Testimonials carousel, CTA section, Footer

**Auth**
- `/login` — email + password, glassmorphic card
- `/register` — multi-step (Account → Profile → Internship details) with progress indicator, avatar upload, skill tags
- Lovable Cloud auth (email/password + Google), email auto-confirm on for fast testing
- `profiles` table (linked to `auth.users`) with bio, avatar, skills, internship dates, type, goal
- `user_roles` table + `app_role` enum (`intern`, `hr`, `admin`) + `has_role()` security definer function
- Auto-create profile + default `intern` role via signup trigger
- Protected routes by role; redirect to role-appropriate dashboard

## Stage 2 — Intern Experience

**Feed (`/feed`)** — 3-column layout
- Left: user card + nav (Feed, My Projects, Create, AI Assistant, Progress, Notifications, Settings) + quick stats
- Center: create-post box, tabs (For You / Following / Trending), infinite-scroll project cards with like, comment, save, share, tags, media
- Right: trending projects, top interns, popular tags

**My Projects (`/my-projects`)**
- Tabs: All / Approved / Pending / Drafts
- Grid cards with status badge, edit/delete/view actions
- Stats modal with charts

**Create Project (`/create-project`)**
- Two-column form: title, rich-text description, media upload (Lovable Cloud Storage), GitHub + demo URLs
- Tech stack tags (max 5), difficulty, individual/team
- "✨ Improve with AI" button → edge function calls Lovable AI to rewrite description, diff modal
- Save draft / Submit for review (status = pending)

**Profile (`/profile/:username`)**
- Cover, avatar, bio, stats row, tabs (Projects / Activity / About), follow button

**Settings (`/settings`)**
- Profile, Account, Notifications, Privacy tabs

## Stage 3 — AI Assistant & Progress

**AI Assistant (`/ai-assistant`)**
- Chat UI with conversation history sidebar
- Streaming responses via edge function → Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Quick-action prompt chips, code-block formatting, daily usage meter
- Conversations persisted per user

**My Progress (`/internship-progress`)**
- Days left counter, 4 stat cards (duration, projects, skills, engagement)
- Vertical milestones timeline, skills heatmap, achievement badges grid

## Stage 4 — HR Dashboard

Routes under `/hr/*`, gated to `hr` role:
- `/hr/dashboard` — KPI widgets, activity feed, quick actions
- `/hr/interns` — table with filters, bulk actions, intern profile modal
- `/hr/evaluations` — rating form (5 categories, 1-5 stars), history with progress chart
- `/hr/attendance` — calendar with color-coded days, summary, CSV export
- `/hr/inbox` — real-time messaging (Cloud Realtime) with conversation list
- `/hr/tickets` — ticket list, create modal, detail thread with status updates

## Stage 5 — Admin Panel

Routes under `/staff/*`, gated to `admin` role:
- `/staff/console` — metrics, system health, recent logs, quick actions
- `/staff/users` — user table, role management, ban/edit modals
- `/staff/approvals` — pending project queue, approve/reject with reason templates, bulk approve
- `/staff/logs` — audit log table with filters and JSON detail
- `/staff/ai-control` — usage stats, rate limit settings, model config, cost tracking
- `/staff/analytics` — Recharts: user growth, posts, engagement, top tags; PDF export

## Database (Lovable Cloud)

Tables (all with RLS):
- `profiles`, `user_roles`, `projects`, `project_likes`, `project_saves`, `comments`, `follows`, `notifications`, `ai_conversations`, `ai_messages`, `ai_usage`, `evaluations`, `attendance`, `messages`, `conversations`, `tickets`, `ticket_messages`, `audit_logs`, `admin_settings`

Storage buckets: `avatars` (public), `project-media` (public), `attachments` (private)

## Edge Functions

- `improve-description` — Lovable AI rewrite for project descriptions
- `ai-chat` — streaming chat assistant with usage tracking + rate limit
- `submit-project` / `moderate-project` — status transitions + audit log
- `analytics-summary` — aggregated metrics for admin

## Technical Notes

- React 18 + Vite + Tailwind + React Router + TanStack Query + Framer Motion + Recharts + react-hook-form + zod
- Realtime: Lovable Cloud Postgres changes for feed updates and HR inbox
- Roles via `user_roles` table + `has_role()` SECURITY DEFINER (never on profiles)
- Auth listener set up before `getSession`; `emailRedirectTo: window.location.origin`
- All AI calls go through edge functions (never client-side); 402/429 surfaced as toasts

## What ships per stage

After each stage the app is usable end-to-end for that scope. Recommended order is Stage 1 → 2 → 3 → 4 → 5; you can pause, request changes, or reorder between stages.
