import type { Metadata } from 'next';
import Link from 'next/link';
import { launchBlogPosts } from '@/lib/content/blog';

export const metadata: Metadata = {
  title: 'Spexly Blog',
  description: 'Planning workflows and guides for vibe coders building AI apps.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 text-slate-100">
      <h1 className="text-4xl font-semibold">Spexly Blog</h1>
      <p className="mt-3 text-slate-300">Guides for planning before coding.</p>

      <div className="mt-10 space-y-4">
        {launchBlogPosts.map((post) => (
          <article key={post.slug} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-cyan-300">{post.publishedAt}</p>
            <h2 className="mt-2 text-xl font-semibold">
              <Link href={`/blog/${post.slug}`} className="hover:text-cyan-300">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-slate-300">{post.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
