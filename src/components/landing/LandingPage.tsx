import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { LandingTracking } from '@/components/landing/LandingTracking';
import { LandingCtaButtons } from '@/components/landing/LandingCtaButtons';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { launchBlogPosts } from '@/lib/content/blog';

const faqItems = [
  {
    question: 'What is Spexly?',
    answer: 'Spexly is a visual planning workspace for vibe coders to map features, screens, prompts, and build flow before coding.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes. A free tier will launch first, with optional paid upgrades for advanced workflows.',
  },
  {
    question: 'When is launch?',
    answer: 'The first private beta is launching in invitation waves. Waitlist members get priority access.',
  },
  {
    question: 'Which tools does it support?',
    answer: 'You can plan for Cursor, Bolt, Claude, Lovable, Replit, and similar AI coding tools.',
  },
];

export function LandingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spexly.com';
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Spexly',
    url: baseUrl,
    slogan: 'Spec It Before You Ship It',
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Spexly',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    description:
      'Spexly is a visual planning canvas for vibe coders to spec their app before writing prompts.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className="relative overflow-x-hidden bg-slate-950 text-slate-50">
      <LandingTracking sourcePage="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="landing-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.22),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.12),transparent_45%)]" />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 pb-10 pt-20">
        <div className="flex min-h-[70vh] flex-col justify-center gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-6">
            <AnimatedSection trigger="load" delay={0}>
              <Image
                src="/spexly-logo-white.png"
                alt="Spexly"
                width={160}
                height={64}
                priority
                className="h-auto w-40"
              />
            </AnimatedSection>
            <AnimatedSection trigger="load" delay={0.1}>
              <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                Spec It Before You Ship It
              </p>
            </AnimatedSection>
            <AnimatedSection trigger="load" delay={0.15}>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Plan your AI app before you burn credits.
              </h1>
            </AnimatedSection>
            <AnimatedSection trigger="load" delay={0.25}>
              <p className="text-base text-slate-200 sm:text-lg">
                Spexly turns your idea into a visual blueprint so you can build with clarity in Cursor, Bolt,
                Claude, and more.
              </p>
            </AnimatedSection>
            <AnimatedSection trigger="load" delay={0.35}>
              <LandingCtaButtons />
            </AnimatedSection>
          </div>

          <AnimatedSection trigger="load" delay={0.4} className="w-full max-w-md">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-900/20">
              <p className="mb-3 text-sm text-slate-300">Join the launch waitlist</p>
              <Suspense fallback={<div className="animate-pulse h-32 bg-slate-800 rounded" />}>
                <WaitlistForm compact />
              </Suspense>
            </div>
          </AnimatedSection>
        </div>

        {/* Hero product shot — full-width canvas below the fold */}
        <AnimatedSection trigger="load" delay={0.5}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-900/30">
            <Image
              src="/gallery-detail.png"
              alt="Spexly canvas with feature detail panel — plan features, user stories, and architecture in one view"
              width={1400}
              height={700}
              className="h-auto w-full"
              priority
              unoptimized
            />
          </div>
        </AnimatedSection>
      </section>

      {/* ── Comparison ────────────────────────────────────── */}
      <section className="relative mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 md:grid-cols-2">
        <AnimatedSection delay={0}>
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6">
            <h2 className="mb-3 text-2xl font-semibold">Without planning</h2>
            <ul className="space-y-2 text-slate-200">
              <li>Prompt thrash and wasted tokens</li>
              <li>Disconnected features and broken flows</li>
              <li>No reliable roadmap for launch</li>
            </ul>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={0.12}>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
            <h2 className="mb-3 text-2xl font-semibold">With Spexly</h2>
            <ul className="space-y-2 text-slate-200">
              <li>Visual project map before coding starts</li>
              <li>Feature status tracking while you build</li>
              <li>Reusable prompts linked to product scope</li>
            </ul>
          </div>
        </AnimatedSection>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">How it works</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Go from raw idea to build-ready blueprint in minutes.
          </p>
        </AnimatedSection>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <AnimatedSection delay={0}>
            <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">1</span>
              <h3 className="mt-4 text-lg font-semibold">Describe your idea</h3>
              <p className="mt-2 text-sm text-slate-300">
                Pick a template or import a PRD. Our AI wizard asks the right questions to understand your project.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-templates.png"
                  alt="Template picker — choose SaaS Starter, Marketplace, or blank canvas"
                  width={460}
                  height={540}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">2</span>
              <h3 className="mt-4 text-lg font-semibold">See your blueprint</h3>
              <p className="mt-2 text-sm text-slate-300">
                Get an auto-generated canvas with features, pages, and architecture mapped out visually.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-canvas-full.png"
                  alt="Full canvas view — visual node map of features, pages, and architecture"
                  width={600}
                  height={580}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">3</span>
              <h3 className="mt-4 text-lg font-semibold">Build with clarity</h3>
              <p className="mt-2 text-sm text-slate-300">
                Export prompts, track progress, and ship with confidence in Cursor, Bolt, or Claude.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-export.png"
                  alt="Export options — Claude Code, Cursor, Bolt/Lovable, PDF, GitHub Issues"
                  width={310}
                  height={650}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Built For Your Stack ─────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-12">
        <AnimatedSection>
          <p className="text-center text-sm font-medium uppercase tracking-wider text-slate-400">
            Built for your stack
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {['Cursor', 'Bolt', 'Claude', 'Lovable', 'Replit', 'v0'].map((tool) => (
              <span
                key={tool}
                className="text-lg font-semibold text-slate-500 transition hover:text-slate-300"
              >
                {tool}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ── Feature Deep Dive ─────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl space-y-20 px-6 py-16">
        {/* Feature 1: Detail panel — text left, image right */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <AnimatedSection>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Feature nodes</p>
              <h2 className="mt-2 text-3xl font-semibold">Spec every feature in depth</h2>
              <p className="mt-3 text-slate-300">
                Each node captures the summary, problem statement, user story, acceptance criteria, priority, and effort — everything your AI coding tool needs to build it right the first time.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-cyan-900/10">
              <Image
                src="/gallery-feature-panel.png"
                alt="Feature detail panel — summary, problem, user story, priority, and effort fields"
                width={390}
                height={880}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Feature 2: Import — image left, text right */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <AnimatedSection delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-cyan-900/10">
              <Image
                src="/gallery-import.png"
                alt="Import document — paste text, upload files, connect Notion, or import conversations"
                width={1100}
                height={800}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Import anything</p>
              <h2 className="mt-2 text-3xl font-semibold">Bring your existing work</h2>
              <p className="mt-3 text-slate-300">
                Paste a PRD, upload a doc, connect Notion, or drop in a Claude Code conversation. Spexly parses it and auto-generates your canvas.
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* Feature 3: Prompts — text left, image right */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <AnimatedSection>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Prompt nodes</p>
              <h2 className="mt-2 text-3xl font-semibold">Prompts tied to features</h2>
              <p className="mt-3 text-slate-300">
                Write prompts with a target tool, break them into tasks, and track results — all linked to the feature they implement.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-cyan-900/10">
              <Image
                src="/gallery-prompt.png"
                alt="Prompt node with target tool selector, task breakdown, and result notes"
                width={550}
                height={900}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Feature 4: Subtasks — image left, text right */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <AnimatedSection delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl shadow-cyan-900/10">
              <Image
                src="/gallery-subtasks.png"
                alt="Subtask checklist on a canvas node — track build progress visually"
                width={548}
                height={336}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Progress tracking</p>
              <h2 className="mt-2 text-3xl font-semibold">Track progress as you build</h2>
              <p className="mt-3 text-slate-300">
                Break any node into subtasks and check them off as you go. See at a glance what&apos;s done and what&apos;s left across your entire project.
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* Feature 5: Conversation import — text left, image right */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <AnimatedSection>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">AI conversation import</p>
              <h2 className="mt-2 text-3xl font-semibold">Turn chats into plans</h2>
              <p className="mt-3 text-slate-300">
                Drop a Claude Code transcript or paste any AI conversation. Spexly extracts features, screens, and architecture decisions automatically.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-cyan-900/10">
              <Image
                src="/gallery-conversation.png"
                alt="Conversation import — drop a Claude Code .jsonl transcript or paste AI conversations"
                width={650}
                height={520}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">Built for builders like you</h2>
        </AnimatedSection>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <AnimatedSection delay={0}>
            <article className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-5">
              <div className="overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-node.png"
                  alt="A single feature node — structured planning for beginners"
                  width={800}
                  height={202}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              <h3 className="mt-4 font-semibold">Beginner vibe coder</h3>
              <p className="mt-2 text-sm text-slate-300">Avoid chaos and build your first app with a clear plan. Every feature gets its own node with guided fields.</p>
            </article>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <article className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-5">
              <div className="overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-canvas.png"
                  alt="Full canvas — manage complex projects visually"
                  width={1400}
                  height={1354}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              <h3 className="mt-4 font-semibold">Solo indie builder</h3>
              <p className="mt-2 text-sm text-slate-300">Ship faster without losing structure. See your entire project mapped out on one canvas.</p>
            </article>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <article className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-5">
              <div className="overflow-hidden rounded-lg border border-slate-700/50">
                <Image
                  src="/gallery-export.png"
                  alt="Export options — share specs with students and teams"
                  width={310}
                  height={650}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              <h3 className="mt-4 font-semibold">Creator educator</h3>
              <p className="mt-2 text-sm text-slate-300">Teach repeatable AI building workflows. Export to PDF, TODO.md, or GitHub Issues to share with students.</p>
            </article>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-12">
        <AnimatedSection>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-5 py-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
              </span>
              <span className="text-sm font-medium text-cyan-200">
                Builders are already on the waitlist
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Join vibe coders who plan before they prompt. Early access invites go out in waves.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">FAQ</h2>
        </AnimatedSection>
        <div className="mt-8 space-y-4">
          {faqItems.map((item, i) => (
            <AnimatedSection key={item.question} delay={i * 0.08}>
              <article className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── Blog Teasers ──────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">From the blog</h2>
          <p className="mt-3 text-slate-300">Guides for planning before coding.</p>
        </AnimatedSection>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {launchBlogPosts.slice(0, 2).map((post, i) => (
            <AnimatedSection key={post.slug} delay={i * 0.1}>
              <article className="flex h-full flex-col rounded-xl border border-slate-700 bg-slate-900 p-5">
                <p className="text-xs uppercase tracking-wider text-cyan-300">{post.publishedAt}</p>
                <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-300">{post.description}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Read more &rarr;
                </Link>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <AnimatedSection className="relative mx-auto w-full max-w-4xl px-6 py-20">
        <section id="waitlist">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 sm:p-8">
            <h2 className="text-3xl font-semibold">Get early access</h2>
            <p className="mt-2 text-slate-300">
              Join now to receive launch updates, weekly planning tips, and first-wave beta invites.
            </p>
            <div className="mt-6">
              <Suspense fallback={<div className="animate-pulse h-64 bg-slate-800 rounded" />}>
                <WaitlistForm />
              </Suspense>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="relative border-t border-slate-800 px-6 py-8 text-sm text-slate-300">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/spexly-logo-white.png"
              alt="Spexly"
              width={100}
              height={40}
              className="h-auto w-24"
            />
            <span className="text-slate-400">Plan your app visually before you build.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/waitlist" className="hover:text-white">Waitlist</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <a
              href="https://x.com/spexlyapp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
              aria-label="Follow Spexly on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
