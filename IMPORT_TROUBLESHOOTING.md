# 🔧 Import Troubleshooting Guide

**Issue:** "Failed to import document"

---

## Quick Fixes (Try These First)

### Option 1: Disable Auto-Enhancement (Fastest Test)

If import is failing due to AI enhancement, temporarily disable it:

```bash
# Add to .env.local
AI_AUTO_ENHANCE_ON_IMPORT=false
```

Then:
1. Restart dev server: `npm run dev`
2. Try importing again
3. If it works, the issue was with auto-enhancement

**Note:** You can still manually click "Generate with AI" on each node.

---

### Option 2: Check Server Logs

```bash
# See recent errors
tail -50 /tmp/spexly-dev.log

# Watch live errors
tail -f /tmp/spexly-dev.log
```

Look for:
- ❌ OpenAI API errors (rate limit, API key invalid)
- ❌ Authentication errors (not logged in)
- ❌ Database errors (Supabase connection)

---

### Option 3: Verify Environment Variables

```bash
# Check .env.local has required keys
cat .env.local | grep -E "OPENAI_API_KEY|AI_"
```

**Required:**
- `OPENAI_API_KEY=sk-...` (valid API key)
- `AI_IMPORT_ENABLED=true`

**Optional:**
- `AI_AUTO_ENHANCE_ON_IMPORT=false` (disable auto-enhance)

---

## Common Errors & Solutions

### Error: "OpenAI API key not configured"

**Cause:** Missing or invalid OPENAI_API_KEY

**Fix:**
```bash
# Add to .env.local
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

Then restart: `npm run dev`

---

### Error: "You must be logged in to use AI enhancement"

**Cause:** Not authenticated with Supabase

**Fix:**
1. Go to http://localhost:3000/login
2. Log in or sign up
3. Try import again

---

### Error: "AI quota exceeded" or "Rate limit reached"

**Cause:** Too many OpenAI API calls

**Fix (Temporary):**
```bash
# Disable auto-enhance
AI_AUTO_ENHANCE_ON_IMPORT=false
```

**Fix (Long-term):**
- Check OpenAI billing/limits
- Wait a few minutes
- Reduce number of features/screens in PRD

---

### Error: "Failed to enhance feature with AI"

**Cause:** Individual enhancement failing

**What Happens:**
- Import still succeeds
- Nodes created without AI context
- You can manually click "Generate with AI"

**Debug:**
Check browser console (F12) for specific error messages

---

## Step-by-Step Debugging

### 1. Test Basic Import (No AI)

Disable AI completely:
```bash
# .env.local
AI_IMPORT_ENABLED=false
AI_AUTO_ENHANCE_ON_IMPORT=false
```

Try importing - if this works, issue is AI-related.

---

### 2. Test Import Without Auto-Enhance

```bash
# .env.local
AI_IMPORT_ENABLED=true
AI_AUTO_ENHANCE_ON_IMPORT=false  # ← Add this
```

Try importing - if this works, issue is with auto-enhancement.

---

### 3. Test Manual Enhancement

1. Import with auto-enhance disabled
2. Click on a Feature node
3. Click "Generate with AI" button
4. Check if this works

If manual works but auto doesn't:
- Possible race condition
- Possible batch limit issue

---

### 4. Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try import again
4. Look for errors (red text)

Common errors:
- `Failed to fetch` - Network issue
- `401 Unauthorized` - Not logged in
- `500 Internal Server Error` - Server-side issue

---

## Performance Limits

Auto-enhancement has safety limits:

```typescript
// Max nodes to auto-enhance (prevents API overload)
maxNodesToEnhance = 10
```

**If your PRD has >10 features or screens:**
- First 10 will auto-enhance
- Rest will be basic nodes
- Manually click "Generate" on remaining nodes

**To change limit:**
Edit `/src/app/actions/import.ts` line ~583:
```typescript
const maxNodesToEnhance = 20; // Increase to 20
```

---

## Fallback Behavior

Import is designed to be resilient:

```
Try AI import
  ↓ If fails
Try fallback (rule-based parsing)
  ↓ If fails
Return error
```

**If you see nodes created but empty:**
- Fallback mode activated
- Basic nodes created
- No AI enhancement

---

## Testing Checklist

- [ ] Server running? `lsof -ti:3000`
- [ ] Logged in? Check auth status
- [ ] Valid API key? Check .env.local
- [ ] Browser console clear? No errors
- [ ] Try with auto-enhance disabled?
- [ ] Try with small PRD (1-2 features)?

---

## Quick Recovery

If all else fails:

```bash
# Nuclear option - fresh restart
cd /Users/enovak/Desktop/spexly/Spexly

# Kill server
lsof -ti:3000 | xargs kill -9

# Clear caches
rm -rf .next .turbo node_modules/.cache

# Restart
npm run dev
```

Then try import again.

---

## Contact Info

If issue persists:
1. Copy error from browser console
2. Copy error from server logs: `tail -100 /tmp/spexly-dev.log`
3. Share PRD content (if not sensitive)

---

## Current Status

✅ **Server:** http://localhost:3000
✅ **Auto-Enhance:** Enabled (can disable with env var)
✅ **Max Nodes:** 10 features + 10 screens
✅ **Fallback:** Available if AI fails

**Try importing now - if it fails, follow steps above!**
