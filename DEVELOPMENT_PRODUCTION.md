# Development to Production Deployment Plan

**Project:** Spexly
**Target Platform:** Vercel
**Last Updated:** February 13, 2026

---

## 📊 Current Status

### ✅ Completed Security Features

- [x] Row Level Security (RLS) policies deployed
- [x] Input validation (XSS, SQL injection prevention)
- [x] Secure error handling
- [x] Enhanced password requirements (12 chars, complexity)
- [x] Password strength indicator
- [x] Email verification system (code ready)
- [x] Rate limiting system (code ready)
- [x] Security headers (CSP, HSTS, etc.)

### ⏳ Pending Configuration (Before Production)

- [x] Upstash Redis setup (Step 3 - completed February 13, 2026)
- [x] Email verification gate integration (Step 4 - completed)
- [ ] Local testing of all security features (Step 5)
- [ ] Production environment variables setup (Step 6)
- [ ] Sentry error tracking integration
- [ ] CAPTCHA implementation (optional but recommended)

---

## 🎯 Pre-Production Checklist

### Phase 1: Complete Current Security Setup (Est. 30 min)

#### Step 3: Upstash Redis Configuration ✅
**Status:** Completed (February 13, 2026)
**Priority:** HIGH - Required for rate limiting
**Time:** 10 minutes

**Actions:**
1. Create Upstash account at https://console.upstash.com/
2. Create Redis database (Regional, free tier)
3. Copy REST URL and Token
4. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```
5. Verify in development: `npm run dev` should start without errors
6. Verify connectivity:
   - `upstash_ping ok` via direct Redis set/get test

**Testing:**
- Try logging in 6 times with wrong password → should rate limit on 6th attempt
- Rapidly save canvas 31+ times → should rate limit

---

#### Step 4: Integrate Email Verification Gate
**Status:** Completed
**Priority:** MEDIUM - Prevents spam accounts
**Time:** 5 minutes

**Actions:**
1. Open `src/app/layout.tsx`
2. Add import:
   ```tsx
   import { EmailVerificationGate } from '@/components/auth/EmailVerificationGate';
   ```
3. Wrap children:
   ```tsx
   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body>
           <EmailVerificationGate>
             {children}
           </EmailVerificationGate>
         </body>
       </html>
     );
   }
   ```
4. Save file

**Testing:**
- Create new account → should show "verify your email" screen
- Click resend → should receive new email
- Verify email → should grant access

---

#### Step 5: Local Testing Suite
**Status:** Not Started
**Priority:** HIGH - Verify everything works
**Time:** 15 minutes

**Test Checklist:**

**Authentication Tests:**
- [ ] Weak password rejected (`password123`)
- [ ] Strong password accepted (`MySecure123!@#`)
- [ ] Password strength indicator shows 4 levels correctly
- [ ] Email verification required after signup
- [ ] Resend verification email works
- [ ] Login rate limiting (6+ attempts = blocked)

**Security Tests:**
- [ ] XSS attempt in project name sanitized: `<script>alert('xss')</script>`
- [ ] SQL injection attempt blocked: `'; DROP TABLE projects; --`
- [ ] User A cannot access User B's projects (create 2 test accounts)
- [ ] 501+ nodes rejected
- [ ] 1001+ edges rejected

**Rate Limiting Tests:**
- [ ] 31+ rapid canvas saves = rate limited
- [ ] 101+ project operations/min = rate limited

**Browser Tests:**
- [ ] Security headers present (check DevTools Network tab)
- [ ] CSP not blocking legitimate requests
- [ ] App works in Chrome, Firefox, Safari

---

### Phase 2: Production Infrastructure (Est. 2 hours)

#### Step 6: Sentry Error Tracking Integration
**Status:** Not Started
**Priority:** HIGH - Essential for production monitoring
**Time:** 30 minutes

**Why Sentry:**
- Real-time error tracking
- User impact analysis
- Performance monitoring
- Release tracking
- Integrates with existing error logging

**Setup:**

1. **Create Sentry Account:**
   - Go to https://sentry.io/signup/
   - Create organization (use free tier)

2. **Create Project:**
   - Select "Next.js" as platform
   - Name: `spexly-production`
   - Click "Create Project"

3. **Install Sentry SDK:**
   ```bash
   cd Spexly
   npx @sentry/wizard@latest -i nextjs
   ```

   This wizard will:
   - Install `@sentry/nextjs`
   - Create `sentry.client.config.ts` and `sentry.server.config.ts`
   - Update `next.config.ts`
   - Add environment variables to `.env.local`

4. **Configure Error Logging Integration:**

   Update `/src/lib/errors/index.ts`:

   ```typescript
   import * as Sentry from '@sentry/nextjs';

   export function logError(error: unknown, context?: ErrorContext): void {
     // Development logging
     if (process.env.NODE_ENV === 'development') {
       console.error('Error occurred:', {
         error: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack : undefined,
         context,
         timestamp: new Date().toISOString(),
       });
     }

     // Production: Send to Sentry
     if (process.env.NODE_ENV === 'production') {
       Sentry.captureException(error, {
         contexts: { custom: context },
         tags: {
           action: context?.action,
           userId: context?.userId,
         },
       });
     }
   }
   ```

5. **Add to Vercel Environment Variables:**
   ```env
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_ORG=your-org
   SENTRY_PROJECT=spexly-production
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

6. **Test Locally:**
   ```typescript
   // Add to any page temporarily:
   throw new Error('Test Sentry Integration');
   ```

   Check Sentry dashboard for the error.

**Sentry Features to Configure:**
- [ ] Error alerts (email/Slack when errors spike)
- [ ] Performance monitoring (track slow API calls)
- [ ] Release tracking (connect to Vercel deployments)
- [ ] User feedback widget (optional)

---

#### Step 7: CAPTCHA Integration (Anti-Bot Protection)
**Status:** Not Started
**Priority:** MEDIUM - Prevents automated attacks
**Time:** 45 minutes

**Recommendation:** Use **Cloudflare Turnstile** (better UX than reCAPTCHA)

**Why Turnstile:**
- ✅ Privacy-friendly (no tracking)
- ✅ Better user experience (often invisible)
- ✅ Free tier: 1M requests/month
- ✅ GDPR compliant
- ❌ reCAPTCHA: Privacy concerns, Google dependency

**Setup:**

1. **Get Turnstile Credentials:**
   - Go to https://dash.cloudflare.com/
   - Go to Turnstile section
   - Add a site
   - Copy Site Key and Secret Key

2. **Install Package:**
   ```bash
   npm install @marsidev/react-turnstile
   ```

3. **Add Environment Variables:**
   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
   TURNSTILE_SECRET_KEY=0x4AAB...
   ```

4. **Update SignUpForm.tsx:**

   ```tsx
   import Turnstile from '@marsidev/react-turnstile';

   export function SignUpForm() {
     const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();

       // Verify CAPTCHA token
       if (!turnstileToken) {
         setError('Please complete the verification');
         return;
       }

       // ... rest of signup logic
     };

     return (
       <form onSubmit={handleSubmit}>
         {/* ... existing fields ... */}

         <Turnstile
           siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
           onSuccess={setTurnstileToken}
         />

         {/* ... submit button ... */}
       </form>
     );
   }
   ```

5. **Add Server-Side Verification:**

   Create `/src/lib/captcha/verify.ts`:

   ```typescript
   export async function verifyCaptcha(token: string): Promise<boolean> {
     const response = await fetch(
       'https://challenges.cloudflare.com/turnstile/v0/siteverify',
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           secret: process.env.TURNSTILE_SECRET_KEY,
           response: token,
         }),
       }
     );

     const data = await response.json();
     return data.success === true;
   }
   ```

6. **Update signUp in auth-helpers.ts:**

   ```typescript
   export async function signUp(
     email: string,
     password: string,
     captchaToken: string
   ) {
     // Verify CAPTCHA first
     const captchaValid = await verifyCaptcha(captchaToken);
     if (!captchaValid) {
       throw new Error('CAPTCHA verification failed');
     }

     // ... rest of signup logic
   }
   ```

**Apply CAPTCHA to:**
- [ ] Signup form (highest priority)
- [ ] Login form (after 3 failed attempts)
- [ ] Password reset form
- [ ] Contact forms (if any)

---

#### Step 8: Advanced Authentication Features
**Status:** Not Started
**Priority:** LOW - Post-launch enhancement
**Time:** 4-6 hours

**Recommended Additions:**

##### 8.1 Two-Factor Authentication (2FA/TOTP)
**Use Case:** Extra security for sensitive accounts

**Implementation:**
- Use Supabase's MFA feature (currently in beta)
- Or implement with `speakeasy` package
- QR code generation with `qrcode` package
- Backup codes for account recovery

**Files to Create:**
- `/src/components/auth/TwoFactorSetup.tsx`
- `/src/components/auth/TwoFactorVerify.tsx`
- `/src/lib/auth/totp.ts`

**Time:** 3-4 hours

---

##### 8.2 Session Management Dashboard
**Use Case:** Users can see and revoke active sessions

**Features:**
- List all active sessions with device/location info
- "Sign out all other devices" button
- Last active timestamp
- Suspicious login alerts

**Files to Create:**
- `/src/app/settings/sessions/page.tsx`
- `/src/components/settings/SessionList.tsx`

**Time:** 2-3 hours

---

##### 8.3 Magic Link Authentication
**Use Case:** Passwordless login option

**Implementation:**
- Already supported by Supabase
- Add UI option in login form
- Email contains one-time link
- Expires after 1 hour

**Files to Update:**
- `/src/components/auth/LoginForm.tsx`
- `/src/lib/supabase/auth-helpers.ts`

**Time:** 1 hour

---

### Phase 3: Production Deployment (Est. 1 hour)

#### Step 9: Vercel Deployment Setup
**Status:** Not Started
**Priority:** HIGH - Final step
**Time:** 30 minutes

**Pre-Deployment Checklist:**

1. **Environment Variables in Vercel:**

   Go to Vercel Dashboard → Your Project → Settings → Environment Variables

   Add all production variables:
   ```env
   # Supabase (Production)
   NEXT_PUBLIC_SUPABASE_URL=https://erapfczmqsydstngjrpd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key

   # Upstash Redis (Production)
   UPSTASH_REDIS_REST_URL=https://your-prod-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-prod-token

   # Sentry (Production)
   SENTRY_DSN=https://your-dsn@sentry.io/project
   SENTRY_AUTH_TOKEN=your-auth-token

   # Turnstile (Production)
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
   TURNSTILE_SECRET_KEY=0x4AAB...
   ```

2. **Verify Build Locally:**
   ```bash
   npm run build
   # Should complete with no errors
   ```

3. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   vercel --prod
   ```

4. **Post-Deployment Verification:**
   - [ ] Visit production URL
   - [ ] Create test account
   - [ ] Verify email works (check spam folder)
   - [ ] Create a test project
   - [ ] Test security features (XSS, SQL injection attempts)
   - [ ] Check Sentry dashboard for any errors
   - [ ] Verify rate limiting works
   - [ ] Test on mobile device

---

#### Step 10: Production Monitoring Setup
**Status:** Not Started
**Priority:** HIGH - Monitor after launch
**Time:** 30 minutes

**Tools to Configure:**

1. **Vercel Analytics:**
   - Enable in Vercel Dashboard
   - Free tier: 2,500 events/month
   - Tracks page views, Web Vitals

2. **Sentry Performance Monitoring:**
   - Enable in Sentry project settings
   - Set performance thresholds
   - Configure alerts for slow queries

3. **Upstash Redis Monitoring:**
   - Check Upstash dashboard weekly
   - Monitor: Request count, memory usage
   - Set up alerts if approaching limits

4. **Supabase Monitoring:**
   - Monitor database size (free tier: 500MB)
   - Check auth users count
   - Review API usage

5. **Custom Health Check Endpoint:**

   Create `/src/app/api/health/route.ts`:
   ```typescript
   import { NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';

   export async function GET() {
     try {
       // Check database connection
       const supabase = await createClient();
       const { error } = await supabase.from('projects').select('count').limit(1);

       if (error) throw error;

       return NextResponse.json({
         status: 'healthy',
         timestamp: new Date().toISOString(),
         services: {
           database: 'up',
           redis: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'not configured',
         }
       });
     } catch (error) {
       return NextResponse.json(
         { status: 'unhealthy', error: 'Database connection failed' },
         { status: 503 }
       );
     }
   }
   ```

6. **Set Up UptimeRobot (Optional):**
   - Free monitoring service
   - Pings `/api/health` every 5 minutes
   - Email/SMS alerts if site goes down
   - https://uptimerobot.com/

---

## 🔮 Future Enhancements (Post-Launch)

### Security Enhancements

#### Audit Logging System
**Priority:** MEDIUM
**Time:** 3-4 hours

**Purpose:** Track all security-relevant events for compliance and forensics

**Implementation:**
1. Create `audit_logs` table in Supabase
2. Log events: login, logout, project CRUD, failed auth attempts
3. Include: user_id, action, IP address, timestamp, metadata
4. Admin dashboard to view logs
5. Auto-delete logs after 90 days (GDPR compliance)

**Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

#### Content Security Policy (CSP) Refinement
**Priority:** LOW
**Time:** 2 hours

**Current:** Permissive CSP with `unsafe-inline` and `unsafe-eval`
**Goal:** Strict CSP with nonces/hashes

**Steps:**
1. Audit all inline scripts/styles
2. Move to external files or use nonces
3. Generate CSP nonce per request
4. Test thoroughly (CSP can break apps easily)

---

#### IP-Based Rate Limiting
**Priority:** MEDIUM
**Time:** 2 hours

**Current:** Rate limiting by user ID
**Addition:** Also rate limit by IP address (prevents pre-auth attacks)

**Implementation:**
- Add IP-based limiters for unauthenticated routes
- Combine with Cloudflare's built-in DDoS protection
- Different limits for authenticated vs. unauthenticated users

---

### User Experience Enhancements

#### Email Notifications
**Priority:** MEDIUM
**Time:** 4 hours

**Notifications to Add:**
- Welcome email after verification
- Password changed confirmation
- New device login alert
- Project shared with you (future feature)
- Weekly digest of activity

**Tools:**
- Supabase has built-in email templates
- Or use SendGrid/Postmark for more control

---

#### Progressive Web App (PWA)
**Priority:** LOW
**Time:** 3 hours

**Features:**
- Offline support
- Install to home screen
- Push notifications (project updates)
- Background sync

**Files to Create:**
- `public/manifest.json`
- `public/sw.js` (service worker)
- Update `next.config.ts`

---

### Performance Optimizations

#### Database Query Optimization
**Priority:** HIGH (once you have users)
**Time:** Ongoing

**Tasks:**
- Add indexes for frequently queried fields
- Use database query analyzer
- Implement pagination for large project lists
- Consider database read replicas if scaling

---

#### Edge Functions for Global Performance
**Priority:** LOW
**Time:** 2-3 hours

**Use Case:** Serve API routes from edge locations

**Implementation:**
- Move auth checks to Vercel Edge Functions
- Cache static data at edge
- Reduces latency for global users

---

## 📋 Production Launch Checklist

### Pre-Launch (Do Before Going Live)

**Code Quality:**
- [x] All TypeScript errors resolved (`npm run build`)
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed or documented
- [ ] Code commented where complex
- [ ] Re-enable free tier enforcement in `src/app/actions/projects.ts` — `getUserTier()` currently hardcoded to return `'pro'` (bypasses all limits). Restore the original Supabase `profiles` table lookup and ensure the `profiles` migration has been run. Also run the `profiles` migration (`supabase/migrations/202602100002_add_user_tier_system.sql`) against production Supabase before deploying.
- [ ] Remove dev upgrade files: `/src/app/dev-upgrade/`, `/src/app/api/dev-upgrade/`, `/src/app/actions/upgradeToProDEV.ts`

**Security:**
- [ ] All environment variables in Vercel
- [ ] RLS policies tested with multiple users
- [ ] Rate limiting tested and working
- [ ] Email verification tested
- [ ] CAPTCHA working on signup
- [ ] Security headers verified in production

**Testing:**
- [ ] All critical user flows tested
- [ ] Mobile responsive design verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Error states handled gracefully
- [ ] Loading states implemented

**Infrastructure:**
- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured
- [ ] Database backups enabled (Supabase auto-backups)
- [ ] SSL certificate active (Vercel auto)

**Legal/Compliance:**
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Cookie consent banner (if using analytics)
- [ ] GDPR compliance reviewed (if EU users)

**Documentation:**
- [ ] README.md updated with deployment instructions
- [ ] API documentation (if applicable)
- [ ] User guide/help docs
- [ ] Developer onboarding guide

---

### Post-Launch (First 48 Hours)

**Monitoring:**
- [ ] Check Sentry for errors every 4 hours
- [ ] Monitor Vercel analytics for traffic patterns
- [ ] Watch Upstash Redis usage
- [ ] Check Supabase database size

**User Feedback:**
- [ ] Set up feedback collection mechanism
- [ ] Monitor social media mentions
- [ ] Track support requests
- [ ] Note common user issues

**Performance:**
- [ ] Check Core Web Vitals scores
- [ ] Identify slow API endpoints
- [ ] Monitor database query performance
- [ ] Optimize if needed

---

### Week 1 Review

**Metrics to Track:**
- Total signups
- Email verification rate
- Active daily users
- Average session duration
- Error rate (via Sentry)
- Rate limit hit count
- Failed login attempts

**Actions:**
- [ ] Address any critical bugs
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Review security logs
- [ ] Plan next features based on feedback

---

## 🛠️ Maintenance Schedule

### Daily
- Check Sentry for new errors
- Review critical alerts

### Weekly
- Review Upstash Redis usage
- Check Supabase database size
- Review failed login attempts
- Update dependencies if needed

### Monthly
- Security audit (review RLS policies, check for vulnerabilities)
- Performance review (database indexes, slow queries)
- Cost review (Vercel, Upstash, Supabase usage)
- Backup verification (test restore process)

### Quarterly
- Dependency updates (`npm update`)
- Security penetration testing
- User feedback implementation
- Feature roadmap review

---

## 📞 Emergency Contacts & Resources

### Critical Services

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- Status: https://www.vercel-status.com/
- Support: support@vercel.com

**Supabase:**
- Dashboard: https://supabase.com/dashboard
- Status: https://status.supabase.com/
- Support: https://supabase.com/support

**Upstash:**
- Dashboard: https://console.upstash.com/
- Docs: https://docs.upstash.com/
- Support: support@upstash.com

**Sentry:**
- Dashboard: https://sentry.io/
- Status: https://status.sentry.io/
- Support: https://sentry.io/support/

**Cloudflare:**
- Dashboard: https://dash.cloudflare.com/
- Status: https://www.cloudflarestatus.com/
- Support: https://support.cloudflare.com/

---

## 🎯 Success Metrics

### Security Metrics
- Zero data breaches
- < 0.1% failed authentication rate (excluding brute force)
- 100% of users with verified emails
- < 1% of requests rate limited (legitimate users)

### Performance Metrics
- Lighthouse score: > 90
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s

### Business Metrics
- User signup conversion rate: > 60%
- Email verification rate: > 80%
- User retention (7-day): > 40%
- Average session duration: > 5 minutes

---

## 📝 Notes

### Current Implementation Status
**Last Updated:** February 13, 2026

- Security foundation: ✅ Complete
- Rate limiting: ✅ Configured (Upstash REST URL/token set and connectivity verified)
- Email verification: ✅ Integrated in `src/app/layout.tsx`
- Error tracking: ❌ Not started
- CAPTCHA: ❌ Not started
- Production deployment: ❌ Not started

### Estimated Total Time to Production
- Complete current setup: ~1 hour
- Sentry integration: ~30 minutes
- CAPTCHA integration: ~45 minutes
- Testing & QA: ~1 hour
- Deployment & monitoring: ~1 hour

**Total: ~4-5 hours of focused work**

---

## 🚀 Quick Start (Resume Work)

When you're ready to continue:

```bash
# 1. Navigate to project
cd ~/Desktop/Spexly/Spexly

# 2. Make sure dependencies are installed
npm install

# 3. Check your current .env.local
cat .env.local

# 4. Start development server
npm run dev

# 5. Open checklist and continue from Step 5 (local security testing)
```

---

**Questions or issues?** Refer to `/SECURITY_IMPLEMENTATION.md` for detailed implementation notes.
