import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { LandingTracking } from '@/components/landing/LandingTracking';
import { LandingCtaButtons } from '@/components/landing/LandingCtaButtons';
import { AnimatedSection } from '@/components/landing/AnimatedSection';

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
      <section className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col justify-center gap-10 px-6 py-20 lg:flex-row lg:items-center">
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

      {/* ── Product Preview ───────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">Product preview</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Start with guided project setup, auto-generate your first node map, then organize features,
            screens, and prompts in one planning canvas.
          </p>
        </AnimatedSection>

        {/* Full canvas screenshot */}
        <AnimatedSection delay={0.1}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-900/20">
            <Image
              src="/gallery-canvas.png"
              alt="Spexly canvas — visual node map of an app's features, pages, and architecture"
              width={1400}
              height={1354}
              className="h-auto w-full"
              unoptimized
            />
          </div>
        </AnimatedSection>

        {/* Detail screenshots */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src="/gallery-node.png"
                  alt="Spexly node card — a single feature node on the planning canvas"
                  width={800}
                  height={202}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              <p className="text-sm text-slate-300">
                Each node represents a feature, page, or component in your project.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.3}>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src="/gallery-subtasks.png"
                  alt="Spexly subtasks — track progress with built-in task checklists"
                  width={548}
                  height={336}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
              <p className="text-sm text-slate-300">
                Break nodes into subtasks and track progress as you build.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <AnimatedSection>
          <h2 className="text-3xl font-semibold">Use cases</h2>
        </AnimatedSection>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <AnimatedSection delay={0}>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-5">
              <h3 className="font-semibold">Beginner vibe coder</h3>
              <p className="mt-2 text-sm text-slate-300">Avoid chaos and build your first app with a clear plan.</p>
            </article>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-5">
              <h3 className="font-semibold">Solo indie builder</h3>
              <p className="mt-2 text-sm text-slate-300">Ship faster without losing structure across features.</p>
            </article>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-5">
              <h3 className="font-semibold">Creator educator</h3>
              <p className="mt-2 text-sm text-slate-300">Teach repeatable AI building workflows with visual specs.</p>
            </article>
          </AnimatedSection>
        </div>
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
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/waitlist" className="hover:text-white">Waitlist</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
