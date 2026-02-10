import type { TechCategory, TargetTool } from '@/types/nodes';

export type TemplateId = 'blank' | 'saas' | 'marketplace' | 'content' | 'internal';

export interface TemplateTechStackItem {
  category: TechCategory;
  toolName: string;
  notes?: string;
}

export interface TemplatePromptItem {
  text: string;
  targetTool?: TargetTool;
}

export interface SpexlyTemplate {
  id: TemplateId;
  label: string;
  description: string;
  features: string[];
  screens: string[];
  techStack: TemplateTechStackItem[];
  promptPack: TemplatePromptItem[];
}

export const TEMPLATE_OPTIONS: SpexlyTemplate[] = [
  {
    id: 'blank',
    label: 'Blank Canvas',
    description: 'Start from scratch with your own idea and custom features.',
    features: [],
    screens: [],
    techStack: [],
    promptPack: [],
  },
  {
    id: 'saas',
    label: 'SaaS Starter',
    description: 'Subscription-based product with team workspaces and billing.',
    features: ['User auth', 'Team workspace', 'Usage dashboard', 'Billing & subscriptions', 'Settings'],
    screens: ['Landing', 'Signup', 'Workspace', 'Dashboard', 'Billing', 'Settings'],
    techStack: [
      { category: 'Frontend', toolName: 'Next.js 15', notes: 'App Router + React' },
      { category: 'Backend', toolName: 'Next.js API routes', notes: 'Edge-ready APIs' },
      { category: 'Database', toolName: 'Supabase', notes: 'Postgres + RLS' },
      { category: 'Auth', toolName: 'Supabase Auth', notes: 'Email + OAuth' },
      { category: 'Hosting', toolName: 'Vercel', notes: 'Preview deploys' },
    ],
    promptPack: [
      { text: 'Generate the core data models for users, teams, and subscriptions.' },
      { text: 'Design the dashboard layout and navigation structure.' },
      { text: 'Implement onboarding and billing flows with Stripe.' },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    description: 'Two-sided marketplace with listings, search, and checkout.',
    features: ['Listings', 'Search & filters', 'Checkout', 'Messaging', 'Reviews', 'Admin moderation'],
    screens: ['Home', 'Search results', 'Listing detail', 'Checkout', 'Messages', 'Profile'],
    techStack: [
      { category: 'Frontend', toolName: 'Next.js 15', notes: 'Server components + client UI' },
      { category: 'Backend', toolName: 'Supabase + Edge Functions', notes: 'Listings + transactions' },
      { category: 'Database', toolName: 'Supabase', notes: 'Postgres + storage' },
      { category: 'Auth', toolName: 'Supabase Auth', notes: 'Buyer/seller roles' },
      { category: 'Hosting', toolName: 'Vercel', notes: 'Fast global edge' },
    ],
    promptPack: [
      { text: 'Define the listing, order, and messaging schemas.' },
      { text: 'Create search and filtering UI with facets.' },
      { text: 'Build checkout flow with payment status tracking.' },
    ],
  },
  {
    id: 'content',
    label: 'Content Studio',
    description: 'Publishing platform with editor, tags, and analytics.',
    features: ['Rich editor', 'Publishing workflow', 'Tags & categories', 'SEO pages', 'Analytics'],
    screens: ['Home', 'Article', 'Editor', 'Dashboard', 'Settings'],
    techStack: [
      { category: 'Frontend', toolName: 'Next.js 15', notes: 'MDX or editor integration' },
      { category: 'Backend', toolName: 'Supabase', notes: 'Content + analytics events' },
      { category: 'Database', toolName: 'Supabase', notes: 'Postgres + storage' },
      { category: 'Auth', toolName: 'Supabase Auth', notes: 'Creators + admins' },
      { category: 'Hosting', toolName: 'Vercel', notes: 'SEO-friendly deploys' },
    ],
    promptPack: [
      { text: 'Plan the content schema and publishing statuses.' },
      { text: 'Design an editor experience with autosave.' },
      { text: 'Outline analytics events for readership metrics.' },
    ],
  },
  {
    id: 'internal',
    label: 'Internal Tool',
    description: 'Operations dashboard with data tables and workflows.',
    features: ['Secure login', 'Data tables', 'CRUD forms', 'Role-based access', 'Audit logs'],
    screens: ['Login', 'Dashboard', 'Records', 'Record detail', 'Settings'],
    techStack: [
      { category: 'Frontend', toolName: 'Next.js 15', notes: 'Table-heavy UI' },
      { category: 'Backend', toolName: 'Supabase', notes: 'Row-level security' },
      { category: 'Database', toolName: 'Supabase', notes: 'Postgres + audit logs' },
      { category: 'Auth', toolName: 'Supabase Auth', notes: 'Admin roles' },
      { category: 'Hosting', toolName: 'Vercel', notes: 'Protected routes' },
    ],
    promptPack: [
      { text: 'Define core tables and CRUD operations.' },
      { text: 'Design role-based access and permissions.' },
      { text: 'Build data table UI with filters and bulk actions.' },
    ],
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = 'blank';

export function getTemplateById(id: TemplateId): SpexlyTemplate | undefined {
  return TEMPLATE_OPTIONS.find((template) => template.id === id);
}
