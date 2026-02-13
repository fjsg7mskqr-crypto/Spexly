/**
 * Customizable import defaults for features and tech stack.
 * Edit this file to define your preferred defaults when AI extraction fails.
 */

import type { TechCategory } from '@/types/nodes';

// ========================================
// FEATURE TEMPLATES
// ========================================

export interface FeatureTemplate {
  keywords: string[];
  feature: string;
}

/**
 * Feature detection patterns.
 * When these keywords appear in PRD, the corresponding feature will be suggested.
 */
export const FEATURE_TEMPLATES: FeatureTemplate[] = [
  { keywords: ['auth', 'login', 'signup', 'register', 'sign up', 'sign in'], feature: 'User Authentication' },
  { keywords: ['dashboard', 'overview', 'home'], feature: 'Dashboard' },
  { keywords: ['profile', 'account', 'settings'], feature: 'User Profile' },
  { keywords: ['search', 'find', 'filter'], feature: 'Search & Filter' },
  { keywords: ['notification', 'alert', 'email'], feature: 'Notifications' },
  { keywords: ['payment', 'billing', 'subscription', 'checkout'], feature: 'Payment Integration' },
  { keywords: ['report', 'analytics', 'insights'], feature: 'Reporting & Analytics' },
  { keywords: ['chat', 'message', 'messaging'], feature: 'Messaging System' },
  { keywords: ['upload', 'file', 'image'], feature: 'File Upload' },
  { keywords: ['admin', 'manage', 'management'], feature: 'Admin Panel' },

  // Add your custom feature templates here:
  // { keywords: ['your', 'keywords'], feature: 'Your Feature Name' },
];

/**
 * Generic features used when no specific features are detected.
 * Optimized for typical web app needs.
 */
export const GENERIC_FEATURES = [
  'User Authentication & Authorization',
  'Dashboard / Home Screen',
  'Data Management & CRUD Operations',
  'User Profile & Settings',
];

// ========================================
// TECH STACK TEMPLATES
// ========================================

export interface TechTemplate {
  keywords: string[];
  tech: {
    category: TechCategory;
    toolName: string;
    notes: string;
  };
}

/**
 * Technology detection patterns.
 * When these keywords appear in PRD, the corresponding tech will be added to stack.
 */
export const TECH_TEMPLATES: TechTemplate[] = [
  // Frontend Frameworks
  { keywords: ['react', 'react.js', 'reactjs'], tech: { category: 'Frontend', toolName: 'React', notes: 'UI framework' } },
  { keywords: ['next', 'next.js', 'nextjs'], tech: { category: 'Frontend', toolName: 'Next.js', notes: 'React framework with SSR' } },
  { keywords: ['vue', 'vue.js', 'vuejs'], tech: { category: 'Frontend', toolName: 'Vue.js', notes: 'Progressive UI framework' } },
  { keywords: ['angular'], tech: { category: 'Frontend', toolName: 'Angular', notes: 'TypeScript framework' } },
  { keywords: ['svelte', 'sveltekit'], tech: { category: 'Frontend', toolName: 'Svelte', notes: 'Compiled UI framework' } },

  // CSS & Styling
  { keywords: ['tailwind', 'tailwindcss'], tech: { category: 'Frontend', toolName: 'Tailwind CSS', notes: 'Utility-first CSS' } },
  { keywords: ['bootstrap'], tech: { category: 'Frontend', toolName: 'Bootstrap', notes: 'CSS framework' } },
  { keywords: ['sass', 'scss'], tech: { category: 'Frontend', toolName: 'Sass', notes: 'CSS preprocessor' } },

  // Languages
  { keywords: ['typescript', 'ts'], tech: { category: 'Frontend', toolName: 'TypeScript', notes: 'Type-safe JavaScript' } },

  // Backend Runtimes & Frameworks
  { keywords: ['node', 'node.js', 'nodejs'], tech: { category: 'Backend', toolName: 'Node.js', notes: 'JavaScript runtime' } },
  { keywords: ['express', 'expressjs'], tech: { category: 'Backend', toolName: 'Express', notes: 'Node.js web framework' } },
  { keywords: ['fastify'], tech: { category: 'Backend', toolName: 'Fastify', notes: 'Fast Node.js framework' } },
  { keywords: ['nestjs', 'nest'], tech: { category: 'Backend', toolName: 'NestJS', notes: 'TypeScript framework' } },

  // Python Frameworks
  { keywords: ['python', 'django'], tech: { category: 'Backend', toolName: 'Django', notes: 'Python web framework' } },
  { keywords: ['flask'], tech: { category: 'Backend', toolName: 'Flask', notes: 'Python micro-framework' } },
  { keywords: ['fastapi'], tech: { category: 'Backend', toolName: 'FastAPI', notes: 'Modern Python API framework' } },

  // Databases - SQL
  { keywords: ['postgres', 'postgresql'], tech: { category: 'Database', toolName: 'PostgreSQL', notes: 'Relational database' } },
  { keywords: ['mysql'], tech: { category: 'Database', toolName: 'MySQL', notes: 'Popular SQL database' } },
  { keywords: ['sqlite'], tech: { category: 'Database', toolName: 'SQLite', notes: 'Lightweight SQL database' } },

  // Databases - NoSQL
  { keywords: ['mongodb', 'mongo'], tech: { category: 'Database', toolName: 'MongoDB', notes: 'Document database' } },
  { keywords: ['redis'], tech: { category: 'Database', toolName: 'Redis', notes: 'In-memory data store' } },

  // Backend-as-a-Service
  { keywords: ['supabase'], tech: { category: 'Database', toolName: 'Supabase', notes: 'Open-source Firebase alternative' } },
  { keywords: ['firebase'], tech: { category: 'Database', toolName: 'Firebase', notes: 'Google BaaS platform' } },
  { keywords: ['appwrite'], tech: { category: 'Database', toolName: 'Appwrite', notes: 'Open-source BaaS' } },

  // Authentication Services
  { keywords: ['auth0'], tech: { category: 'Auth', toolName: 'Auth0', notes: 'Authentication & authorization' } },
  { keywords: ['clerk'], tech: { category: 'Auth', toolName: 'Clerk', notes: 'User management platform' } },
  { keywords: ['next-auth', 'nextauth'], tech: { category: 'Auth', toolName: 'NextAuth.js', notes: 'Next.js authentication' } },

  // Hosting & Deployment
  { keywords: ['vercel'], tech: { category: 'Hosting', toolName: 'Vercel', notes: 'Frontend deployment platform' } },
  { keywords: ['netlify'], tech: { category: 'Hosting', toolName: 'Netlify', notes: 'Jamstack deployment' } },
  { keywords: ['aws', 'amazon web services'], tech: { category: 'Hosting', toolName: 'AWS', notes: 'Cloud infrastructure' } },
  { keywords: ['heroku'], tech: { category: 'Hosting', toolName: 'Heroku', notes: 'PaaS platform' } },
  { keywords: ['railway'], tech: { category: 'Hosting', toolName: 'Railway', notes: 'Infrastructure platform' } },
  { keywords: ['fly.io', 'fly'], tech: { category: 'Hosting', toolName: 'Fly.io', notes: 'Global app platform' } },

  // Other Services
  { keywords: ['stripe'], tech: { category: 'Other', toolName: 'Stripe', notes: 'Payment processing' } },
  { keywords: ['sendgrid'], tech: { category: 'Other', toolName: 'SendGrid', notes: 'Email delivery service' } },
  { keywords: ['twilio'], tech: { category: 'Other', toolName: 'Twilio', notes: 'Communication APIs' } },

  // Add your custom tech templates here:
  // { keywords: ['your-tech'], tech: { category: 'Other', toolName: 'Your Tech', notes: 'Description' } },
];

/**
 * Default tech stack used when NO technologies are detected.
 * Optimized for solo developers building modern web apps.
 *
 * Current preset: Next.js + Supabase + Vercel (Full-Stack Starter)
 */
export const DEFAULT_TECH_STACK: Array<{
  category: TechCategory;
  toolName: string;
  notes: string;
}> = [
  { category: 'Frontend', toolName: 'Next.js 15', notes: 'React framework with App Router (recommended for new projects)' },
  { category: 'Frontend', toolName: 'TypeScript', notes: 'Type-safe development (highly recommended)' },
  { category: 'Frontend', toolName: 'Tailwind CSS', notes: 'Utility-first CSS framework' },
  { category: 'Database', toolName: 'Supabase', notes: 'PostgreSQL + Auth + Storage + Realtime (all-in-one backend)' },
  { category: 'Auth', toolName: 'Supabase Auth', notes: 'Built-in authentication with social providers' },
  { category: 'Hosting', toolName: 'Vercel', notes: 'Zero-config Next.js deployment' },
];

// ========================================
// CUSTOMIZATION GUIDE
// ========================================

/**
 * HOW TO CUSTOMIZE:
 *
 * 1. ADD CUSTOM FEATURE TEMPLATES:
 *    - Add entries to FEATURE_TEMPLATES array
 *    - Use lowercase keywords for matching
 *    - Feature name will appear in Feature nodes
 *
 * 2. ADD CUSTOM TECH TEMPLATES:
 *    - Add entries to TECH_TEMPLATES array
 *    - Choose appropriate category
 *    - Notes field helps users understand the tech
 *
 * 3. CHANGE DEFAULT STACK:
 *    - Edit DEFAULT_TECH_STACK array
 *    - These are used when NO tech is detected
 *    - Useful for your preferred starter kit
 *
 * EXAMPLE - Add Remix framework:
 * { keywords: ['remix'], tech: { category: 'Frontend', toolName: 'Remix', notes: 'Full-stack React framework' } }
 *
 * EXAMPLE - Add Feature:
 * { keywords: ['webhook', 'integration'], feature: 'Webhook Integration' }
 */
