import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, launchBlogPosts } from '@/lib/content/blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return launchBlogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post not found | Spexly Blog',
    };
  }

  return {
    title: `${post.title} | Spexly Blog`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-slate-100">
      <Link href="/blog" className="text-sm text-cyan-300 hover:text-cyan-200">
        Back to blog
      </Link>
      <h1 className="mt-5 text-4xl font-semibold">{post.title}</h1>
      <p className="mt-3 text-slate-300">{post.description}</p>
      <p className="mt-2 text-xs uppercase tracking-wider text-cyan-300">{post.publishedAt}</p>

      <article className="mt-10 space-y-6 text-slate-200">
        {post.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>

      <div className="mt-12 rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">Want early access?</h2>
        <p className="mt-2 text-sm text-slate-300">Join the Spexly waitlist to get launch updates and beta invites.</p>
        <Link href="/waitlist" className="mt-4 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
          Join Waitlist
        </Link>
      </div>
    </main>
  );
}
