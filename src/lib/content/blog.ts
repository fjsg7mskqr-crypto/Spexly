export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  content: string[];
}

export const launchBlogPosts: BlogPost[] = [
  {
    slug: 'vibe-coding-planner-before-you-build',
    title: 'Why Every Vibe Coder Needs a Planner Before Writing Prompts',
    description: 'How visual planning reduces token waste and scope chaos in AI-assisted app building.',
    publishedAt: '2026-02-11',
    content: [
      'Most failed vibe coding projects do not fail because of code quality. They fail because scope is unclear from day one.',
      'A visual planner gives you a single source of truth for feature priorities, screen flow, and prompt intent before you start coding.',
      'When each prompt maps back to a defined node, you spend fewer credits and keep your architecture coherent.',
    ],
  },
  {
    slug: 'how-to-plan-an-ai-app-project',
    title: 'How to Plan an AI App Project in 30 Minutes',
    description: 'A practical workflow for moving from raw idea to build-ready project map.',
    publishedAt: '2026-02-11',
    content: [
      'Start with the root brief: who the app is for, what problem it solves, and what success looks like.',
      'Define 3 to 5 core features only. Attach priority and status so execution decisions are visible.',
      'Map screens to each feature, then draft tool-specific prompts to reduce ambiguity during build.',
    ],
  },
  {
    slug: 'vibe-coding-workflow-that-ships',
    title: 'A Vibe Coding Workflow That Actually Ships',
    description: 'Move from experimentation to predictable shipping with structured planning loops.',
    publishedAt: '2026-02-11',
    content: [
      'Use a weekly loop: plan, build, validate, and update feature statuses.',
      'Treat prompts as implementation artifacts tied to feature outcomes, not standalone ideas.',
      'Shipping velocity improves when planning and build feedback are connected in one system.',
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return launchBlogPosts.find((post) => post.slug === slug);
}
