import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

/**
 * Built-in templates with AI context pre-populated
 * These serve as examples and starting points for beginners
 */

export interface BuiltInTemplate {
  id: string;
  name: string;
  description: string;
  category: 'MVP' | 'Feature' | 'Full App';
  nodes: SpexlyNode[];
  edges: SpexlyEdge[];
}

export const BUILTIN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'auth-feature',
    name: 'Authentication Feature',
    description: 'User signup and login with AI context for implementation',
    category: 'Feature',
    nodes: [
      {
        id: 'feature-1',
        type: 'feature',
        position: { x: 100, y: 100 },
        data: {
          featureName: 'User Authentication',
          summary: 'Allow users to sign up and log in to access personalized features',
          problem: 'Users need a secure way to create accounts and access protected content',
          userStory: 'As a user, I want to create an account and log in so that I can access personalized features',
          acceptanceCriteria: [
            'User can sign up with email and password',
            'User can log in with credentials',
            'Passwords are securely hashed',
            'Invalid credentials show error message',
            'Logged-in users can access protected routes',
          ],
          priority: 'Must',
          status: 'Planned',
          effort: 'L',
          dependencies: [],
          risks: 'Security vulnerabilities if not implemented correctly',
          metrics: 'Successful signup/login rate, authentication errors',
          notes: '',
          // AI Context Fields
          aiContext: 'Follow RESTful API patterns. Use bcrypt for password hashing. JWT tokens for session management. Implement rate limiting on auth endpoints to prevent brute force attacks.',
          implementationSteps: [
            'Set up auth database schema (users table with email, hashed_password, created_at)',
            'Create signup API endpoint (/api/auth/signup)',
            'Create login API endpoint (/api/auth/login)',
            'Add JWT token generation and validation middleware',
            'Implement password hashing with bcrypt (10 salt rounds)',
            'Create protected route middleware',
            'Write unit tests for signup/login flows',
            'Add integration test for full authentication flow',
          ],
          codeReferences: [
            'See /api/users for similar CRUD patterns',
            'JWT middleware pattern in /middleware/auth.ts',
            'Database schema in /prisma/schema.prisma',
          ],
          testingRequirements: 'Unit tests for signup/login endpoints. Integration test for full auth flow. Test invalid inputs and edge cases. Security testing for SQL injection and XSS.',
          relatedFiles: [
            '/api/auth/signup.ts',
            '/api/auth/login.ts',
            '/middleware/auth.ts',
            '/lib/jwt.ts',
            '/prisma/schema.prisma',
          ],
          technicalConstraints: 'Must work with PostgreSQL database. JWT tokens expire after 7 days. Passwords must meet complexity requirements (min 8 chars, 1 number, 1 special char).',
          tags: ['auth', 'security', 'backend'],
          estimatedHours: 16,
          version: 1,
          expanded: false,
          completed: false,
        },
      },
    ],
    edges: [],
  },
  {
    id: 'mvp-saas',
    name: 'AI-Ready MVP SaaS',
    description: 'Complete SaaS MVP structure with AI context for rapid implementation',
    category: 'MVP',
    nodes: [
      {
        id: 'idea-1',
        type: 'idea',
        position: { x: 100, y: 50 },
        data: {
          appName: 'SaaS Starter',
          description: 'A subscription-based SaaS application with user authentication, billing, and admin dashboard',
          targetUser: 'Small business owners who need [specific solution]',
          coreProblem: 'Managing [business process] is time-consuming and error-prone',
          projectArchitecture: 'Next.js 14 with App Router, React Server Components, PostgreSQL database, Stripe for payments, and NextAuth for authentication. API routes for backend logic, server actions for mutations.',
          corePatterns: [
            'Server Components for static content',
            'Client Components for interactivity',
            'Server Actions for data mutations',
            'React Query for client-side data fetching',
            'Optimistic updates for better UX',
          ],
          constraints: [
            'Must support mobile browsers',
            'Page load time < 2 seconds',
            'WCAG 2.1 AA accessibility compliance',
            'GDPR compliant data handling',
          ],
          tags: ['saas', 'mvp', 'starter'],
          estimatedHours: 120,
          version: 1,
          expanded: false,
          completed: false,
        },
      },
      {
        id: 'feature-1',
        type: 'feature',
        position: { x: 100, y: 250 },
        data: {
          featureName: 'User Dashboard',
          summary: 'Central hub where users view their account, usage stats, and manage settings',
          problem: 'Users need a clear overview of their account and quick access to key features',
          userStory: 'As a user, I want to see my account overview and usage statistics so that I can monitor my subscription',
          acceptanceCriteria: [
            'Dashboard shows current plan and billing status',
            'Usage metrics displayed with charts',
            'Quick access to account settings',
            'Recent activity log visible',
          ],
          priority: 'Must',
          status: 'Planned',
          effort: 'M',
          dependencies: ['User Authentication must be complete'],
          risks: 'Performance issues if loading too much data at once',
          metrics: 'Dashboard load time, user engagement with stats',
          notes: '',
          aiContext: 'Use React Server Components for static layout. Client components for interactive charts. Fetch data in parallel using Promise.all for better performance. Cache subscription data using React Cache.',
          implementationSteps: [
            'Create dashboard layout component (app/dashboard/page.tsx)',
            'Fetch user subscription data (server component)',
            'Add usage statistics component with charts (recharts library)',
            'Implement activity log with pagination',
            'Add loading skeletons for better perceived performance',
            'Optimize database queries with proper indexes',
          ],
          codeReferences: [
            'Layout pattern in app/layout.tsx',
            'Data fetching in app/api/users/[id]/route.ts',
            'Chart component in components/charts/LineChart.tsx',
          ],
          testingRequirements: 'Integration test for data loading. Visual regression test for charts. Performance test to ensure sub-2s load time.',
          relatedFiles: [
            '/app/dashboard/page.tsx',
            '/components/dashboard/StatsCard.tsx',
            '/components/charts/UsageChart.tsx',
            '/lib/queries/getUserStats.ts',
          ],
          technicalConstraints: 'Must load in < 2 seconds. Chart library bundle size < 50KB gzipped.',
          tags: ['dashboard', 'ui', 'frontend'],
          estimatedHours: 12,
          version: 1,
          expanded: false,
          completed: false,
        },
      },
      {
        id: 'screen-1',
        type: 'screen',
        position: { x: 450, y: 250 },
        data: {
          screenName: 'Dashboard Home',
          purpose: 'Main landing page after login showing account overview',
          keyElements: ['Header with navigation', 'Subscription status card', 'Usage stats chart', 'Recent activity list', 'Quick action buttons'],
          userActions: ['View subscription details', 'Check usage stats', 'Navigate to settings', 'Upgrade plan'],
          states: ['Loading', 'Data loaded', 'Error state', 'Empty state (no data)'],
          navigation: 'Accessible from main nav after login, default landing page',
          dataSources: ['User API (/api/user)', 'Subscription API (/api/subscription)', 'Usage API (/api/usage)'],
          wireframeUrl: '',
          notes: '',
          aiContext: 'Use Tailwind CSS grid for responsive layout. Shadcn/ui components for consistency. Implement skeleton loading states. Use Suspense boundaries for progressive loading.',
          acceptanceCriteria: [
            'All cards render correctly',
            'Chart displays last 30 days of data',
            'Activity log shows last 10 items',
            'Loading states appear during fetch',
          ],
          componentHierarchy: [
            'DashboardPage',
            '  > DashboardHeader',
            '  > StatsGrid',
            '    > SubscriptionCard',
            '    > UsageChart',
            '  > ActivityLog',
          ],
          codeReferences: [
            'Card component: components/ui/Card.tsx',
            'Chart wrapper: components/charts/ChartContainer.tsx',
            'Grid layout: app/dashboard/layout.tsx',
          ],
          testingRequirements: 'Component tests for each card. E2E test for full page load. Accessibility test with axe-core.',
          tags: ['dashboard', 'screen', 'ui'],
          estimatedHours: 8,
          version: 1,
          expanded: false,
          completed: false,
        },
      },
      {
        id: 'tech-1',
        type: 'techStack',
        position: { x: 100, y: 500 },
        data: {
          category: 'Frontend',
          toolName: 'Next.js 14',
          notes: 'App Router with React Server Components',
          version: '14.2.0',
          rationale: 'Best-in-class React framework with excellent DX and performance. Server Components reduce client bundle size.',
          configurationNotes: 'Enable experimental serverActions. Configure image optimization domains in next.config.js.',
          integrationWith: ['React', 'TypeScript', 'Tailwind CSS'],
          tags: [],
          estimatedHours: null,
          expanded: false,
          completed: false,
        },
      },
      {
        id: 'tech-2',
        type: 'techStack',
        position: { x: 300, y: 500 },
        data: {
          category: 'Database',
          toolName: 'PostgreSQL',
          notes: 'With Prisma ORM',
          version: '15',
          rationale: 'Robust, ACID-compliant database with excellent performance for SaaS applications.',
          configurationNotes: 'Set up connection pooling with PgBouncer. Enable row-level security for multi-tenancy.',
          integrationWith: ['Prisma', 'Supabase'],
          tags: [],
          estimatedHours: null,
          expanded: false,
          completed: false,
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'idea-1', target: 'feature-1', type: 'smoothstep' },
      { id: 'e2', source: 'feature-1', target: 'screen-1', type: 'smoothstep' },
    ],
  },
];

/**
 * Get built-in template by ID
 */
export function getBuiltInTemplate(id: string): BuiltInTemplate | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all built-in templates for a category
 */
export function getBuiltInTemplatesByCategory(category: BuiltInTemplate['category']): BuiltInTemplate[] {
  return BUILTIN_TEMPLATES.filter((t) => t.category === category);
}
