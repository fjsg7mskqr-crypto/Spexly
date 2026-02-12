# 🤖 "Generate with AI" Button - Feature Documentation

**Date:** February 11, 2026
**Status:** ✅ **IMPLEMENTED**

---

## 🎯 What Was Added

Created a **"Generate with AI" button** in Feature and Screen nodes that auto-populates AI Context fields using OpenAI.

### The Problem
- Users saw empty AI Context fields (AI Context, Implementation Steps, Code References, Testing Requirements, etc.)
- No way to auto-fill these fields - manual entry only
- Confusion about how to populate implementation guidance

### The Solution
Added a **"Generate with AI"** button that:
1. Takes existing node data (feature name, summary, acceptance criteria, etc.)
2. Sends to OpenAI with specialized prompts
3. Auto-generates implementation guidance
4. Populates all AI Context fields automatically

---

## 📁 Files Created/Modified

### New Files (1):
1. **`/src/app/actions/enhanceNodeWithAI.ts`**
   - Server action for AI enhancement
   - `enhanceFeatureWithAI()` - Generates feature implementation guidance
   - `enhanceScreenWithAI()` - Generates screen/UI implementation guidance

### Modified Files (2):
2. **`/src/components/nodes/FeatureNode.tsx`**
   - Added "Generate with AI" button
   - Added `isGenerating` state
   - Added `handleGenerateAIContext` handler
   - Button positioned next to "AI Context & Implementation" header

3. **`/src/components/nodes/ScreenNode.tsx`**
   - Same changes as FeatureNode
   - Green theme (emerald) instead of violet

---

## 🎨 UI Changes

### Feature Node
**Before:**
```
[ AI Context & Implementation  ▶ ]
```

**After:**
```
[ AI Context & Implementation  ▶ ]  [ ⚡ Generate with AI ]
```

### Button States
1. **Normal:** `[ ⚡ Generate with AI ]`
2. **Generating:** `[ ⏳ Generating... ]` (spinning icon, disabled)
3. **After generation:** Section auto-expands to show populated fields

---

## 🤖 What Gets Generated

### For Feature Nodes:
When you click "Generate with AI", it creates:

1. **AI Context** (2-3 sentences)
   - Patterns/conventions to follow
   - Technical considerations
   - Common gotchas

2. **Implementation Steps** (5-8 steps)
   - Specific, actionable steps
   - File paths where relevant
   - Focus on "what to build"

3. **Code References** (3-5 items)
   - Similar features to reference
   - Relevant file paths/modules
   - Libraries to use

4. **Testing Requirements** (2-3 sentences)
   - What needs testing
   - Edge cases to cover
   - Integration vs unit tests

5. **Related Files** (3-6 file paths)
   - Files likely to be created/modified
   - Example: `/api/users/route.ts`, `/components/UserForm.tsx`

6. **Technical Constraints** (1-2 sentences)
   - Performance considerations
   - Security requirements
   - Scalability concerns

### For Screen Nodes:
When you click "Generate with AI", it creates:

1. **AI Context** (2-3 sentences)
   - Component architecture recommendations
   - State management approach
   - Accessibility considerations

2. **Component Hierarchy** (5-8 components)
   - React component tree structure
   - Example: `<LoginScreen> → <LoginForm> → <EmailInput>`
   - Container vs presentational components

3. **Code References** (3-5 items)
   - Similar UI patterns
   - Component library examples
   - Design system components

4. **Testing Requirements** (2-3 sentences)
   - User interaction tests
   - Accessibility testing
   - Visual regression testing

---

## 📖 How to Use

### Step 1: Create or Import Nodes
- Use AI Wizard to create project
- OR Import a PRD document
- Feature/Screen nodes are created with basic info

### Step 2: Open a Feature or Screen Node
- Click on the node to select it
- Node panel opens on right side

### Step 3: Expand AI Context Section
- Scroll down to "AI Context & Implementation"
- Click to expand (or just click the Generate button)

### Step 4: Generate AI Context
- Click **"Generate with AI"** button
- Wait 3-5 seconds (button shows "Generating...")
- AI Context fields auto-populate!

### Step 5: Review and Edit
- Review generated content
- Edit any fields as needed
- Fields are still manually editable

---

## 🔧 Technical Implementation

### Server Action (`enhanceNodeWithAI.ts`)

```typescript
export async function enhanceFeatureWithAI(input: EnhanceFeatureInput) {
  // 1. Authenticate user
  // 2. Build specialized prompt
  // 3. Call OpenAI GPT-4.1-mini
  // 4. Parse JSON response
  // 5. Return structured data
}
```

### Prompt Strategy

**For Features:**
```
=== FEATURE TO ENHANCE ===
Feature Name: User Authentication
Summary: Allow users to sign up and log in
Acceptance Criteria:
  - User can register with email/password
  - Email verification required
  - Session management

=== GENERATE IMPLEMENTATION GUIDANCE ===
1. AI CONTEXT: What patterns to follow...
2. IMPLEMENTATION STEPS: 5-8 specific steps...
3. CODE REFERENCES: Similar features...
4. TESTING REQUIREMENTS: What to test...
5. RELATED FILES: Files to create/modify...
6. TECHNICAL CONSTRAINTS: Performance/security...

OUTPUT FORMAT (JSON): {...}
```

**Response Example:**
```json
{
  "aiContext": "Follow the existing auth pattern in /api/auth. Use bcrypt for password hashing and JWT for sessions. Check /lib/auth/session.ts for session utilities.",
  "implementationSteps": [
    "Create POST /api/auth/register endpoint",
    "Add user schema to database with email, hashedPassword, verified fields",
    "Implement email verification with token generation",
    "Create login endpoint with password comparison",
    "Set up JWT session creation and validation",
    "Add middleware to protect authenticated routes"
  ],
  "codeReferences": [
    "See /api/users for similar database operations",
    "Reference /lib/email/sendVerification.ts for email service",
    "Use next-auth or similar library for OAuth (optional)"
  ],
  "testingRequirements": "Unit test password hashing and JWT generation. Integration test full registration flow including email verification. Test edge cases: duplicate emails, invalid tokens, expired sessions.",
  "relatedFiles": [
    "/api/auth/register/route.ts",
    "/api/auth/login/route.ts",
    "/lib/auth/hash.ts",
    "/lib/auth/jwt.ts",
    "/middleware/auth.ts"
  ],
  "technicalConstraints": "Use HTTPS only. Rate limit login attempts (5 per minute). Store sessions in httpOnly cookies to prevent XSS."
}
```

### Frontend Integration

```typescript
const handleGenerateAIContext = async () => {
  setIsGenerating(true);
  const result = await enhanceFeatureWithAI({
    featureName: data.featureName,
    summary: data.summary,
    // ... other fields
  });

  if (result.success) {
    updateNodeData(id, result.data); // Update all fields at once
    setShowAiContext(true); // Expand to show
  }
  setIsGenerating(false);
};
```

---

## 💰 Cost & Performance

**Per Generation:**
- Model: `gpt-4.1-mini`
- Max Tokens: 2,000
- Typical Response: ~1,500 tokens
- Cost: ~$0.0003 per generation
- Time: 3-5 seconds

**Rate Limits:**
- User must be authenticated
- Respects OpenAI API rate limits
- No additional rate limiting (yet)

---

## 🎯 Use Cases

### Use Case 1: Planning Implementation
1. Import PRD
2. Feature nodes created with acceptance criteria
3. Click "Generate with AI" on each feature
4. Get detailed implementation steps
5. Share with development team

### Use Case 2: AI-Assisted Development
1. Create feature with AI Wizard
2. Generate AI context
3. Copy implementation steps to cursor/copilot
4. Use as guidance for coding

### Use Case 3: Onboarding New Developers
1. Existing features in canvas
2. New dev generates AI context
3. Reads code references and patterns
4. Understands existing architecture

---

## 🔄 Future Enhancements

**Potential Improvements:**
1. **Batch Generation** - Generate for all features at once
2. **Context Awareness** - Use project tech stack for better suggestions
3. **Code Analysis** - Scan actual codebase for accurate file references
4. **Custom Prompts** - Let users customize generation prompts
5. **Version History** - Track changes to AI-generated content
6. **Export** - Include AI context in exports (already works!)

---

## 🐛 Known Limitations

1. **No Codebase Access** - AI doesn't read your actual code
   - File paths are inferred, not verified
   - Code references might not exist yet

2. **Generic Guidance** - Without project context
   - Suggestions are general best practices
   - May not match your specific tech stack

3. **No Validation** - Generated content not validated
   - Review before using in production
   - Edit to match your conventions

4. **No Rate Limiting** - (Yet)
   - Could hit OpenAI rate limits if spammed
   - Consider adding daily limits

---

## 📚 Related Features

Works seamlessly with:
1. **AI Wizard** - Creates initial nodes → Generate adds details
2. **Document Import** - Imports PRD → Generate adds implementation
3. **Export** - AI context included in exported files
4. **AI Context Indicator** - Shows completeness % after generation

---

## 🎉 Example Workflow

```
1. Import PRD "SaaS Subscription Platform"
   → Creates Feature: "Subscription Management"

2. Click Feature node
   → Opens editor panel

3. Click "Generate with AI"
   → Wait 3 seconds

4. AI generates:
   ✅ AI Context: "Use Stripe for billing, follow subscription patterns in /api/billing..."
   ✅ Implementation Steps:
      - Set up Stripe webhook endpoints
      - Create subscription schema in database
      - Implement plan tier logic
      - Add payment method management
      - Create billing portal integration
   ✅ Code References:
      - /api/billing/webhook.ts
      - /lib/stripe/client.ts
   ✅ Testing: "Test webhook events, subscription upgrades/downgrades, payment failures"
   ✅ Files: /api/subscriptions/route.ts, /components/PlanSelector.tsx
   ✅ Constraints: "PCI compliance, handle webhook idempotency"

5. Export to TODO.md
   → Share with development team
   → Start implementation with clear guidance!
```

---

**Now you can auto-generate implementation guidance with one click!** 🚀
