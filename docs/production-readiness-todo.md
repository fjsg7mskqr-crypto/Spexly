# Production Readiness To-Do

This checklist compiles the remaining blockers plus monitoring work needed before we can comfortably ship Spexly to production.

## 1. Step 5 - Local Security & QA Sweep
- [ ] Run through the password complexity flow (reject weak, accept strong, verify indicator states)
- [ ] Confirm email verification gate blocks unverified accounts and resend flow works
- [ ] Validate RLS isolation by creating two test users and confirming they cannot access each other’s projects/tasks
- [ ] Attempt the documented XSS (`<script>alert('xss')</script>`) and SQL injection (`'; DROP TABLE projects; --`) payloads to ensure sanitization holds
- [ ] Stress canvas/project operations to confirm rate limits: >30 canvas saves/min and >100 project ops/min should be throttled
- [ ] Verify node/edge caps (500/1000) and that security headers remain in place across Chrome, Firefox, Safari

## 2. Sentry Error Monitoring
- [ ] Run `npx @sentry/wizard@latest -i nextjs` to install and scaffold configs
- [ ] Wire `src/lib/errors/index.ts` (or shared logger) to call `Sentry.captureException` in production
- [ ] Add `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` to local + Vercel envs
- [ ] Trigger a test error and confirm it appears in Sentry

## 3. Cloudflare Turnstile CAPTCHA
- [ ] Obtain site + secret keys, add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`
- [ ] Embed the Turnstile component in the signup form (and login/reset after repeated failures)
- [ ] Add server-side token verification helper and hook it into auth actions before Supabase calls
- [ ] Smoke-test flows to make sure humans aren’t blocked while automated attempts fail

## 4. Restore Tier Enforcement
- [ ] Revert `getUserTier()` back to the Supabase `profiles` lookup instead of the temporary `'pro'` constant
- [ ] Run `supabase/migrations/20260210_add_user_tier_system.sql` against production and re-sync types
- [ ] Verify free-tier limits apply again (project quotas, node caps, upgrade banner) and remove leftover dev upgrade files (`/src/app/dev-upgrade/`, `/src/app/api/dev-upgrade/`, `/src/app/actions/upgradeToProDEV.ts`)

## 5. Production Env + Monitoring
- [ ] Mirror all required env vars (Supabase, Upstash, Sentry, Turnstile, ingest secrets) into Vercel and confirm `npm run build` succeeds locally
- [ ] Deploy to Vercel once build passes and rerun smoke tests (auth, dashboard, ingest)
- [ ] Add `/api/health` endpoint plus UptimeRobot/StatusCake monitor hitting it every 5 minutes
- [ ] Enable Sentry alerts, Vercel Analytics, Supabase + Upstash dashboards, and document the on-call/alert flow

Once these boxes are checked we can proceed to the optional enhancements (2FA, session dashboard, audit logging, etc.).
