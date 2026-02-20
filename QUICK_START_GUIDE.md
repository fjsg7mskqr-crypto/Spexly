# Quick Start Guide - Spexly AI Enhancements

**Get up and running in 10 minutes!**

---

## Step 1: Install Dependencies

```bash
cd ~/Desktop/spexly/Spexly
npm install @notionhq/client @anthropic-ai/sdk
```

---

## Step 2: Configure Environment Variables

```bash
# Copy the example template
cp .env.integration.example .env.local

# Edit .env.local with your API keys
nano .env.local
# or
code .env.local
```

**Minimum Required (for Phase 1 & 2):**
```bash
OPENAI_API_KEY=sk-...
AI_WIZARD_ENABLED=true
AI_IMPORT_ENABLED=true
```

**Optional (for Phase 3 - Claude):**
```bash
AI_USE_CLAUDE_FOR_IMPORT=true
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional (for Phase 4 - Integrations):**
See `.env.integration.example` for Notion, Figma, Linear setup.

---

## Step 3: Apply Database Migration

```bash
# Make sure Supabase CLI is installed
# If not: brew install supabase/tap/supabase

# Apply the migration
supabase db push

# Verify the table was created
supabase db diff
```

**Expected Output:**
```
Applied migration: 202602110001_add_integrations_table.sql
✓ integrations table created
✓ RLS policies added
✓ Indexes created
```

---

## Step 4: Test Phase 1 - AI Wizard

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the wizard: http://localhost:3000/wizard

3. Create a new project:
   - App Name: "Task Manager"
   - Description: "A simple task management app"
   - Target User: "Busy professionals"
   - Core Problem: "Keeping track of daily tasks"
   - Features: "Task creation, Task lists, Due dates"
   - Screens: "Dashboard, Task detail, Settings"

4. **Verify:**
   - ✅ Features have ≥3 acceptance criteria
   - ✅ Screens have ≥6 keyElements
   - ✅ User stories follow "As a... I want... so that..." format
   - ✅ No empty nodes

---

## Step 5: Test Phase 2 - Document Import

1. Navigate to: http://localhost:3000/import

2. Paste this sample PRD:
   ```markdown
   # Social Media Dashboard

   ## Description
   A dashboard for managing multiple social media accounts.

   ## Target User
   Social media managers handling 5+ accounts.

   ## Core Problem
   Switching between multiple platforms is time-consuming.

   ## Features
   - Unified feed
   - Post scheduling
   - Analytics dashboard
   - Team collaboration
   - Content calendar

   ## Screens
   - Dashboard
   - Post composer
   - Analytics view
   - Settings
   ```

3. Click "Import with AI"

4. **Verify:**
   - ✅ Feature nodes have `summary`, `acceptanceCriteria`, `risks`
   - ✅ Screen nodes have `keyElements`, `userActions`, `states`
   - ✅ No Note nodes (only structured nodes)

---

## Step 6: Test Phase 3 - Claude (Optional)

1. Set in `.env.local`:
   ```bash
   AI_USE_CLAUDE_FOR_IMPORT=true
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Restart the dev server

3. Import a large PRD (>5000 characters)

4. **Verify:**
   - ✅ Import completes successfully
   - ✅ Structured fields are populated
   - ✅ Check browser console for "Using Claude for import" log

---

## Step 7: Test Phase 4 - Notion Integration

### 7.1 Create Notion OAuth App

1. Go to: https://www.notion.so/my-integrations
2. Click "New integration"
3. Fill in:
   - Name: "Spexly"
   - Associated workspace: [Your workspace]
   - Integration type: "Public"
   - Capabilities: ✅ Read content
4. Copy `OAuth client ID` and `OAuth client secret`
5. Add redirect URI: `http://localhost:3000/api/integrations/notion/callback`

### 7.2 Configure Environment

Add to `.env.local`:
```bash
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
NOTION_REDIRECT_URI=http://localhost:3000/api/integrations/notion/callback
```

### 7.3 Test Notion Import

1. Navigate to: http://localhost:3000/settings/integrations
2. Click "Connect Notion"
3. Authorize the integration
4. You should be redirected back with success message
5. Click "Import from Notion"
6. Select a page
7. **Verify:**
   - ✅ Canvas created with structured nodes
   - ✅ Feature/Screen nodes have detailed fields

---

## Troubleshooting

### Error: "AI wizard enhancement is disabled"
**Solution:** Set `AI_WIZARD_ENABLED=true` in `.env.local`

### Error: "Notion integration not connected"
**Solution:** Complete OAuth flow in Step 7

### Error: "Failed to apply migration"
**Solution:** Check Supabase connection:
```bash
supabase status
supabase db reset
supabase db push
```

### TypeScript Errors
**Solution:** Regenerate Supabase types:
```bash
npm run supabase:types
```

### Import Fails with Large Documents
**Solution:**
1. Check token limits in `import.ts` (should be 4500)
2. Try enabling Claude: `AI_USE_CLAUDE_FOR_IMPORT=true`

---

## Next Steps

1. **Deploy to Staging:** Test with beta users
2. **Monitor Metrics:** Track acceptance criteria quality, keyElements count
3. **Enable Integrations:** Roll out Notion, then Figma, then Linear
4. **Optimize Prompts:** Adjust based on user feedback

---

## Support

- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Environment Variables:** See `.env.integration.example`
- **Database Schema:** See `supabase/migrations/202602110001_add_integrations_table.sql`

---

## Success Criteria Checklist

**Phase 1:**
- [ ] 90% of features have ≥3 acceptance criteria
- [ ] 85% of screens have ≥6 keyElements
- [ ] User stories follow proper format

**Phase 2:**
- [ ] PRD imports create structured nodes
- [ ] No Note nodes with dumped text
- [ ] All fields populated (or gracefully empty)

**Phase 3:**
- [ ] Claude API works for imports
- [ ] Prompt caching reduces costs
- [ ] Quality ≥ OpenAI baseline

**Phase 4:**
- [ ] Notion OAuth flow works
- [ ] Page imports create structured canvases
- [ ] Figma frame extraction works
- [ ] Linear issue export works

---

**Happy Building! 🚀**
