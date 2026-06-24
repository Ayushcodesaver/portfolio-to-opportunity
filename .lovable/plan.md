# Xebure — Remaining Features Plan

This is a large scope. I'll ship it in **3 phases** so you can review each before paying for the next. Please confirm Phase 1 first, or tell me to roll straight through 1 → 3.

---

## Phase 1 — CRITICAL (do now)

### 1. Certificate system
- New table `certificates` (id, intern_id, program_id, certificate_code `XBR-XXXXX`, plan_tier, verified bool, issued_at, pdf_url) + RLS + GRANTs.
- Edge function `issue-certificate`: generates code, renders branded PDF (pdf-lib), uploads to `certificates` storage bucket (public), inserts row.
- Auto-trigger on 100% program completion (DB trigger calls function via pg_net) + manual "Download" button on `InternshipProgress`.
- Premium plan → `verified = true` → gold "Verified" badge on certificate.
- QR code on PDF → `/verify/:code` public page that fetches cert + shows holder, program, dates, verified state.

### 2. Email system (Lovable Emails — built-in, no third-party)
- Set up email domain (I'll show the setup dialog if none configured) → `setup_email_infra` → `scaffold_transactional_email`.
- Templates: `welcome`, `task-reminder`, `task-approved`, `task-rejected`, `milestone-25/50/75/100`, `certificate-ready`, `payment-receipt`.
- Triggers:
  - Welcome → DB trigger on `auth.users` insert (via existing `handle_new_user` extension).
  - Task approved/rejected → on `task_submissions.status` change.
  - Milestone → reuses existing `trg_milestone_check`.
  - Certificate ready → at end of `issue-certificate`.
  - Payment receipt → in `cashfree-webhook` on success.
  - Task reminders → pg_cron every 15 min scans `daily_tasks` for 24h/6h/1h windows, dedupes via `email_send_log.message_id`.

### 3. Notification system
- Already have `notifications` table — add real-time bell in `AppShell` with unread count, dropdown, mark-as-read, links to source.
- Realtime subscription on `notifications` filtered by `user_id`.
- Web Push: `push_subscriptions` table, service worker (`public/sw.js`), edge function `send-push` invoked alongside email/notification inserts. VAPID keys generated via `generate_secret`.
- Settings page → toggles for email + push per category, stored in `profiles.notification_prefs` (jsonb).

---

## Phase 2 — IMPORTANT

### 4. Community chat
Tables: `communities`, `channels` (general/projects/help/random per community), `channel_messages`, `direct_messages`, `presence` (online via Supabase Realtime presence), `chat_attachments` (Storage bucket `chat-files`). HR-only `INSERT` on communities via `has_role`. UI: sidebar with channels + DM list, message pane with file/image upload, online dots.

### 5. Gamification
Mostly wired already (`points_history`, `daily_streaks`, `achievements`). Add:
- Leaderboard tabs: Weekly / Monthly / All-time (windowed SQL view).
- Badge wall on profile.
- Streak widget on dashboard.
- Auto-award points on task approval (DB trigger).

### 6. HR Analytics
`HRDashboard` upgraded with Recharts: completion rate, task trend (line), submissions/day (bar), skill gap (radar from tags vs requirements). CSV export (papaparse) + PDF export (pdf-lib) buttons.

---

## Phase 3 — NICE-TO-HAVE

### 7. Legal
`/privacy`, `/terms` pages with real content. Cookie consent banner (localStorage flag).

### 8. SEO
Per-route `<title>`/`<meta>` via react-helmet-async. Generated `public/sitemap.xml` + cleaned `robots.txt`.

### 9. Security
- 2FA for admin: Supabase MFA TOTP enrollment flow on admin pages.
- Session timeout: idle-watcher hook (configurable, default 30 min) → sign out.
- Rate limiting: **note** — Lovable Cloud has no standard backend rate-limit primitive. I'll add an ad-hoc per-IP token bucket in edge functions (`ai-chat`, `cashfree-create-order`) only if you confirm.

### 10. Performance / Ops
- Sentry: requires DSN (you provide).
- Google Analytics: requires GA4 ID (you provide).
- DB backups: Lovable Cloud handles daily backups automatically — I'll just confirm in docs, no code needed.

---

## Technical notes

- All new tables follow the GRANT + RLS + policy pattern.
- PDFs rendered in edge functions with `pdf-lib` (pure JS, runs on Deno).
- QR codes via `qrcode` npm pkg in edge function.
- No new paid services — uses Lovable Cloud + Lovable Emails + Lovable AI only.
- Cashfree, Supabase Auth, Realtime already wired.

---

## What I need from you

1. **Go-ahead to start Phase 1** (certificate + email + notifications). This alone is ~8–12 file groups and 2 edge functions + 1 migration.
2. If no email domain is configured yet, I'll pop the setup dialog first.
3. For Phase 3 Sentry/GA: send the DSN + GA4 ID when you want them wired.

Reply **"go phase 1"** (or "do everything") and I'll start building.
