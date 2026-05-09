## Build order (4 phases, each shippable on its own)

### Phase A — Blog system
- DB: `blog_posts`, `blog_categories`, `blog_comments`, `blog_post_likes` with RLS
- Pages: `/blog` (list + filterable categories), `/blog/:slug` (3D article viewer with TOC, author card, comments)
- HR/Admin: `/admin/blog` simple CRUD (title, slug, cover, markdown body, category, status)
- Categories seeded: Tutorials, Success Stories, Updates, Tips
- Replace static `Blog.tsx` array with live Supabase data

### Phase B — Gamification
- DB: `achievements` (catalog), `user_achievements` (earned), `daily_streaks`, view `leaderboard_v` materialized from `points_history`
- Streak: increment on login (handled in `AuthContext`), break if >24h gap
- Badges auto-awarded by triggers: first task approved, 7-day streak, milestone 25/50/75/100, top-10 weekly
- New page `/leaderboard` (weekly / monthly / all-time tabs) — uses real `points_history`
- Profile widget: badges grid + streak flame + rank

### Phase C — Certificates + email automation
- Domain check → setup email infra if missing (will prompt you for domain)
- Edge function `generate-certificate` → returns PDF (using @react-pdf/renderer or pdf-lib in Deno) stored in `certificates` bucket
- Trigger on milestone reached (25/50/75/100) → insert notification + queue email via `send-transactional-email`
- Templates: deadline reminder (24h/6h/1h cron), task approved, milestone achieved, certificate ready
- pg_cron job scans `daily_tasks.deadline_at` hourly

### Phase D — Communities + Razorpay
- DB: `communities`, `community_channels`, `community_messages`, `community_memberships`, `subscriptions`, `payment_transactions`
- Plans seeded: Basic ₹999/3mo, Pro ₹1,799/6mo, Premium ₹2,499/12mo
- Edge functions: `razorpay-create-order`, `razorpay-verify-webhook` (signature check), `generate-receipt-pdf`
- Pages: `/communities` (browse + paywall), `/communities/:id` (Discord-style channels, real-time messages), `/billing` (plan history + receipts)
- Secrets needed from you: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

### Out of scope (flagged for later)
- Voice channels (needs WebRTC infra — separate ticket)
- AI plagiarism / auto-feedback (needs separate AI pipeline)
- 2FA, blockchain certs, mobile PWA polish, white-label branding
- Bulk corporate enrollment, reporting API

### Approach
I'll start Phase A right now (biggest visible win, no external deps). After it's working in preview, I'll move to B, then C (will prompt for email domain), then D (will prompt for Razorpay keys).