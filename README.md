# XEBURE

Internship platform where students build a portfolio, complete daily tasks, and get noticed by HR.

## Stack
- React 18 + Vite 5 + TypeScript + Tailwind CSS
- Lovable Cloud backend (database, auth, storage, edge functions)
- TanStack Query for data fetching, realtime invalidation via `useRealtimeInvalidate`
- Framer Motion for animations

## Roles
- **intern** — dashboard, tasks, projects, resume, leaderboard, community
- **hr** — programs, submissions, interns, evaluations, attendance, tickets
- **admin** — user management, content approval, logs, AI control, analytics, UI assets

Roles are stored in the `user_roles` table and checked with the `has_role` security-definer function.

## Local development
```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

## Implemented features

### 1. HR resume list: search, filter, download (`/hr/resumes`)
Searchable HR view of all uploaded student resumes.
- Search by intern name / username.
- Filter by role and by upload date range.
- Per-row download button pulling a signed URL from the private `resumes` bucket.
- Reads via the existing "HR and admins can view all resumes" RLS policy.

### 2. Student profile page (`/my-profile`)
Each intern edits their own details.
- Editable name, contact info (email/phone), and desired role.
- Saved to `profiles`, so HR views show the same data with no extra sync step.
- Validated client-side (zod) and protected by owner-only RLS.

### 3. Internship applications (`/hr/postings`, `/internships`)
Application flow on the dashboard.
- HR posts an internship opening (title, description, role, deadline).
- Students see open postings and apply, attaching their default resume.
- HR reviews applications with status transitions (pending / shortlisted / rejected).

### 4. HR sign-in (`/hr/login`)
Dedicated HR entry point so staff sign in without mixing with student accounts.
- Separate `/hr/login` route that lands on the HR dashboard.
- Access still enforced server-side by the `hr` role, not by the login page used.
- Students who reach the HR login are redirected to the student app.

Progress is tracked in `roadmap.md`.
