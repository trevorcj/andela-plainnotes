# Pathwise: production source and activation guide

Pathwise uses Supabase Auth and PostgreSQL with row-level security. Student records, saved items, drafts, tasks, bookings, messages and notifications come from the API/database. There are no production seed records, demo accounts, preset AI answers, invented counselors or local student data. Browser storage in the Next.js source is used only for appearance preferences. Test fixtures exist exclusively in automated tests.

The existing Sites URL runs the server-rendered Worker integration in the repository's `worker/` directory. This folder is the standard Next.js App Router implementation for independent deployment. Both implementations use the same database migrations and authorization functions. No extra hosting account is needed for the existing Sites link. Supabase and AI credentials are still required to activate live services.

## What has been implemented

- Signup, email confirmation, sign-in, password reset/update and cookie-based session refresh; protected routes and resumable onboarding.
- Sourced course/university/career discovery and detail pages, filters, pagination, university comparison and saved records.
- Persistent plans: add/edit/delete/reorder/complete steps, change course goal and dashboard progress.
- Deterministic eligibility: recently reviewed rules, exam credits/sittings, UTME scores and combinations, missing-data outcomes, saved history and gaps-to-plan.
- Private counselor applications, administrator approval, published availability, locked booking, rescheduling, cancellation, meeting links and completed-session reviews.
- Learning resources, progress, private practice answer keys, scored attempts; real opportunities and deadline-to-plan.
- Persistent AI conversations with optional academic context, reviewed source citations, server-only assistant writes, request deduplication, one active request and an hourly rate limit. No answer is generated if the provider is disconnected. Voice input is optional browser speech recognition.
- In-app booking notifications and preferences, profile/password settings, account export and password-confirmed erasure, a connection/sync screen, source audit and publication tools.

These are implemented code paths, not evidence that live services have been activated. Live email delivery, real accounts, two-device persistence, real bookings and model responses must be tested against your configured project. Automated database and HTTP checks use isolated test infrastructure. Browser/mobile visual and live end-to-end QA remain outstanding.

## Step 1 — Create Supabase

Create an account at https://supabase.com/dashboard and create a project. Keep your database password in your password manager; the app does not need it.

From the project's Connect/API settings, copy:

| Runtime variable | Value | Handling |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | HTTPS Project URL, e.g. `https://PROJECT_REF.supabase.co` | May be shared here |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key starting `sb_publishable_` (legacy anon also works) | May be shared here |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy service-role key, only needed for server-generated AI replies | Secret; configure through secure runtime settings, never in browser/source/chat |
| `OPENAI_API_KEY` | AI provider project key | Secret; configure through the supported secure credential workflow |
| `OPENAI_MODEL` | `gpt-4.1-mini` or another model your account can access | Optional |

For Sites, these are native Sites production runtime variables, not a committed `.env` file or hosting manifest. Only the URL and publishable key are needed to start real accounts, onboarding, catalog, plans, eligibility and counseling. After runtime changes, redeploy the saved version. The Sites owner-private audience is preserved; exposing it to students requires the owner's explicit sharing change.

For standalone Next.js hosting, copy `.env.example` to untracked `.env.local`, and also set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS app origin. Never prefix either secret with `NEXT_PUBLIC_`.

## Step 2 — Install the database

For a new empty project, open Supabase's SQL Editor and execute the downloaded `pathwise-migrations.sql` once. It contains these files in order:

1. `supabase/migrations/202610100001_foundation.sql`
2. `supabase/migrations/202610100002_counselor_applications.sql`
3. `supabase/migrations/202610100003_workflows.sql`
4. `supabase/migrations/202610100004_integrity.sql`
5. `supabase/migrations/202610100005_ai_guard.sql`
6. `supabase/migrations/202610100006_admin_integrity.sql`

If the first two migrations were already applied, run only 3–6. Do not replay existing migrations. Alternatively use the Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Do not install test fixtures. Production seeding is disabled. The catalog starts empty and must be published by an administrator from actual reviewed sources.

## Step 3 — Configure authentication and email

In Supabase Authentication URL Configuration, set Site URL:

```text
https://pathwise-student-guide.satinyshark9.chatgpt.site
```

Add these exact redirect URLs:

```text
https://pathwise-student-guide.satinyshark9.chatgpt.site/auth/callback
https://pathwise-student-guide.satinyshark9.chatgpt.site/auth/callback?next=/auth/update-password
https://pathwise-student-guide.satinyshark9.chatgpt.site/auth/confirm
```

Configure the signup email template for confirmation on a different device:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding
```

Recovery email template:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
```

Enable email/password and email confirmations. Create a sender account with Resend (https://resend.com) or Brevo (https://www.brevo.com), verify a sending domain, and put the SMTP host/port/user/password/sender in Supabase Authentication SMTP settings. Supabase's default test email service is not a production sender. These SMTP credentials belong in Supabase, not the application.

Users visit `/auth/sign-up`, confirm their email, sign in and complete `/onboarding`. HTTP-only, Secure, SameSite cookies retain and refresh sessions across reloads; clearing cookies or signing out ends the browser session. Saved records remain in Supabase and are accessible on a second device after sign-in.

## Step 4 — Create the first administrator and real catalog

Create and confirm your own account using `/auth/sign-up`. In SQL Editor, run once, replacing the email:

```sql
insert into public.user_roles(user_id,role)
select id,'admin' from auth.users where email='YOUR_ADMIN_EMAIL'
on conflict do nothing;
```

You can visit `/admin/sources` and `/admin/catalog` before finishing student onboarding. Add a source URL, publisher and review note describing the facts/cycle you actually verified. Add genuine courses, universities and careers linked to those source IDs; publish them. Only mark a source verified after reviewing it. `/admin/workflows` manages rules, learning resources, opportunities, practice questions and counselor review. Requirements must come from current official JAMB/institution documents. No API feeds or scrapers have been connected automatically.

Students can complete onboarding once courses exist. Counselors register at `/counselors/register`; this route is outside student navigation. Verify credentials before approval, provide a real meeting URL, then let approved counselors add their own availability in `/app/counseling`. Bookings and cancellation notifications are in-app. Meetings open the actual supplied Google Meet/Zoom/etc. link; no video room is fabricated.

## Step 5 — Activate real AI

Create an OpenAI developer account at https://platform.openai.com, create a project, enable billing and create a project API key. Configure `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as server secrets using the supported secure workflow (OpenAI Developers plugin for the AI key). Neither key is ever sent to browsers. Users must opt in before academic context is sent to the model; chat messages are sent to the provider to generate replies. No LLM makes admission eligibility decisions.

## Acceptance checks before opening to students

- Create/confirm/sign in two separate accounts, test recovery, logout and session refresh.
- Complete onboarding, edit results, sign out/in on a second device and check persistence.
- Confirm users cannot read/change each other's records with direct API calls.
- Publish reviewed catalog/rules; exercise complete, incomplete, failing and stale eligibility outcomes.
- Submit a counselor application, approve it, add availability, book/reschedule/cancel; attempt two simultaneous bookings of one slot.
- Complete a real session and review it; verify private meeting links and notifications.
- Complete learning/practice, add an opportunity deadline, save/compare records and change a goal.
- Connect AI, test source/uncertainty behavior, rate limits and disconnected-provider errors.
- Export and erase a test account; test disconnected network, keyboard use and mobile layout.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Node deployments can run `npm start` after build. The fixed header, sidebar, warm green palette and responsive layouts follow the supplied UI reference. The hosted Sites integration renders HTML on the server and uses the same protected Supabase data paths rather than the retired static prototype.

## Current limits

There is no paid-session checkout, calendar synchronization, automated reminder email, live voice scoring, offline private-data cache or automatic source ingestion. Counselors supply meeting links and availability; opportunity applications take place on the real provider's website. The app reports unavailable/empty states rather than simulating these services.
