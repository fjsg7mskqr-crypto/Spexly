'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useState } from 'react';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { LandingTracking } from '@/components/landing/LandingTracking';
import { LandingCtaButtons } from '@/components/landing/LandingCtaButtons';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { launchBlogPosts } from '@/lib/content/blog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Target,
  FileText,
  MessageSquare,
  Upload,
  ChevronDown,
  ArrowRight,
  Layers,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Code2,
  StickyNote,
  Cpu,
  Server,
} from 'lucide-react';

/* ─── Data ────────────────────────────────────────────────────── */

const faqItems = [
  {
    question: 'What is Spexly?',
    answer:
      'Spexly is a visual planning workspace for vibe coders to map features, screens, prompts, and build flow before coding.',
  },
  {
    question: 'Is it free?',
    answer:
      'Yes. A free tier will launch first, with optional paid upgrades for advanced workflows.',
  },
  {
    question: 'When is launch?',
    answer:
      'The first private beta is launching in invitation waves. Waitlist members get priority access.',
  },
  {
    question: 'Which tools does it support?',
    answer:
      'You can plan for Cursor, Bolt, Claude, Lovable, Replit, and similar AI coding tools.',
  },
];

const nodeTypes = [
  {
    label: 'Ideas',
    icon: Lightbulb,
    color: '#fbbf24',
    image: 'gallery-node-idea.png',
    desc: 'Capture raw concepts before they vanish',
  },
  {
    label: 'Features',
    icon: Layers,
    color: '#3b82f6',
    image: 'gallery-node-feature.png',
    desc: 'Spec with stories, criteria & priority',
  },
  {
    label: 'Prompts',
    icon: MessageSquare,
    color: '#60a5fa',
    image: 'gallery-node-prompt.png',
    desc: 'Linked to features, targeted to your tool',
  },
  {
    label: 'Tech Stack',
    icon: Server,
    color: '#fbbf24',
    image: 'gallery-node-tech-stack.png',
    desc: 'Define your architecture upfront',
  },
  {
    label: 'Notes',
    icon: StickyNote,
    color: '#fb923c',
    image: 'gallery-node-note.png',
    desc: 'Scratch-pad for anything else',
  },
];

const tools = [
  { name: 'Cursor', delay: 0 },
  { name: 'Bolt', delay: 0.05 },
  { name: 'Claude', delay: 0.1 },
  { name: 'Lovable', delay: 0.15 },
  { name: 'Replit', delay: 0.2 },
  { name: 'v0', delay: 0.25 },
];

const steps = [
  {
    num: '01',
    title: 'Drop your idea',
    body: 'Pick a template, paste a PRD, or just describe what you want to build. Our AI wizard does the rest.',
    accent: '#06b6d4',
  },
  {
    num: '02',
    title: 'See the blueprint',
    body: 'Your canvas fills with interconnected nodes — features, screens, prompts, tech stack. Drag, connect, refine.',
    accent: '#3b82f6',
  },
  {
    num: '03',
    title: 'Go deep on every feature',
    body: 'Each node captures user stories, acceptance criteria, priority, and effort. Everything your AI tool needs.',
    accent: '#8b5cf6',
  },
  {
    num: '04',
    title: 'Ship with confidence',
    body: 'Export prompts to your coding tool. Track progress with built-in stats. Check off subtasks as you ship.',
    accent: '#10b981',
  },
];

/* ─── Accordion Item ──────────────────────────────────────────── */

function FaqAccordion({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="group w-full text-left"
    >
      <div className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-900/50 px-4 py-4 transition-colors hover:border-slate-600 hover:bg-slate-900/80 sm:px-6 sm:py-5">
        <span className="pr-4 text-base font-semibold text-slate-100 sm:text-lg">
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-cyan-400" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 pt-3 text-sm text-slate-300 sm:px-6 sm:text-base">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ─── Floating Node Badge ─────────────────────────────────────── */

function FloatingBadge({
  label,
  icon: Icon,
  color,
  className,
  delay = 0,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 14,
        delay,
      }}
      className={`absolute flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-4 py-2 shadow-lg backdrop-blur-sm ${className}`}
    >
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="text-sm font-medium text-slate-200">{label}</span>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

export function LandingPageV2() {
  const [activeNode, setActiveNode] = useState(0);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spexlyapp.com';

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
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main className="relative overflow-x-hidden bg-slate-950 text-slate-50">
      <LandingTracking sourcePage="/v2" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── Ambient background ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(6,182,212,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_20%,rgba(59,130,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(139,92,246,0.08),transparent_50%)]" />
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-24">
        {/* Nav-like top bar */}
        <AnimatedSection trigger="load" delay={0}>
          <div className="flex items-center justify-between gap-3">
            <Image
              src="/spexly-logo-white.png"
              alt="Spexly"
              width={130}
              height={52}
              priority
              className="h-auto w-24 sm:w-32"
            />
            <a
              href="#waitlist"
              className="rounded-full border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 sm:px-4 sm:py-1.5"
            >
              Get early access
            </a>
          </div>
        </AnimatedSection>

        <div className="mt-10 grid items-center gap-8 sm:mt-14 lg:mt-24 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          {/* Left — Copy */}
          <div className="space-y-5 sm:space-y-7">
            <AnimatedSection trigger="load" delay={0.08}>
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-xs sm:tracking-widest"
                animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.15)', '0 0 0px rgba(6,182,212,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Spec It Before You Ship It
              </motion.span>
            </AnimatedSection>

            <AnimatedSection trigger="load" delay={0.15}>
              <h1 className="text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                Stop burning credits.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Start with a plan.
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection trigger="load" delay={0.25}>
              <p className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                Spexly turns your raw idea into a visual blueprint — features,
                prompts, architecture — so you can build with{' '}
                <span className="font-semibold text-white">clarity</span> in
                Cursor, Bolt, Claude, and more.
              </p>
            </AnimatedSection>

            <AnimatedSection trigger="load" delay={0.35}>
              <LandingCtaButtons />
            </AnimatedSection>

            {/* Tool trust bar */}
            <AnimatedSection trigger="load" delay={0.45}>
              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Built&nbsp;for
                </span>
                {tools.map((t) => (
                  <motion.span
                    key={t.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + t.delay }}
                    className="rounded-md border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
                  >
                    {t.name}
                  </motion.span>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right — Product shot with floating badges */}
          <AnimatedSection trigger="load" delay={0.3} className="relative">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-cyan-950/40"
            >
              <Image
                src="/gallery-canvas.png"
                alt="Spexly canvas — visual blueprint of your project"
                width={1400}
                height={700}
                className="h-auto w-full"
                priority
                unoptimized
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </motion.div>

            {/* Floating badges — colors match Spexly node types */}
            <FloatingBadge
              label="Feature"
              icon={Layers}
              color="#3b82f6"
              className="hidden -left-4 top-8 sm:flex sm:-left-6"
              delay={0.7}
            />
            <FloatingBadge
              label="Prompt"
              icon={MessageSquare}
              color="#ec4899"
              className="hidden -right-3 top-1/3 sm:flex sm:-right-5"
              delay={0.85}
            />
            <FloatingBadge
              label="Idea"
              icon={Lightbulb}
              color="#a855f7"
              className="hidden -bottom-3 left-12 sm:flex sm:left-16"
              delay={1.0}
            />
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — Compact step cards
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-6 pt-12 sm:px-6 sm:pb-12 sm:pt-24">
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              How it works
            </p>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Idea to blueprint in minutes
          </h2>
        </AnimatedSection>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <AnimatedSection key={step.num} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group relative flex h-full flex-col rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 transition hover:border-slate-600"
              >
                {/* Step number + accent line */}
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${step.accent}18`,
                      color: step.accent,
                    }}
                  >
                    {step.num}
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{
                      background: `linear-gradient(90deg, ${step.accent}30, transparent)`,
                    }}
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {step.body}
                </p>

                {/* Subtle accent glow */}
                <div
                  className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-[40px] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: step.accent, opacity: 0.06 }}
                />
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COMPARISON — Playful split
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <AnimatedSection>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            The difference
          </p>
        </AnimatedSection>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2">
          <AnimatedSection delay={0}>
            <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.07] to-transparent p-5 transition hover:border-rose-500/30 sm:p-7">
              <XCircle className="mb-4 h-8 w-8 text-rose-400/70" />
              <h3 className="text-xl font-bold text-slate-100">
                Without a plan
              </h3>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                  Prompt thrash &amp; wasted tokens
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                  Disconnected features, broken flows
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                  No reliable roadmap for launch
                </li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-5 transition hover:border-emerald-500/30 sm:p-7">
              <CheckCircle2 className="mb-4 h-8 w-8 text-emerald-400/70" />
              <h3 className="text-xl font-bold text-slate-100">
                With Spexly
              </h3>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                  Visual project map before coding starts
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                  Feature status tracking while you build
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                  Reusable prompts linked to product scope
                </li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NODE TYPES — Interactive explorer
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24">
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-violet-400" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              Node types
            </p>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Everything gets its own node
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
            Ideas, features, prompts, tech stack, notes — each with guided
            fields so nothing falls through the cracks.
          </p>
        </AnimatedSection>

        <div className="mt-8 grid gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-[280px_1fr]">
          {/* Selector tabs */}
          <AnimatedSection delay={0.1}>
            <div className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
              {nodeTypes.map((node, i) => {
                const Icon = node.icon;
                const isActive = i === activeNode;
                return (
                  <button
                    key={node.label}
                    type="button"
                    onClick={() => setActiveNode(i)}
                    className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                      isActive
                        ? 'border border-slate-600 bg-slate-800/80 text-white shadow-lg'
                        : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{ color: isActive ? node.color : undefined }}
                    />
                    <div>
                      <span className="block">{node.label}</span>
                      <span className="block text-xs font-normal text-slate-500">
                        {node.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </AnimatedSection>

          {/* Preview */}
          <AnimatedSection delay={0.15}>
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeNode}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center"
                >
                  <Image
                    src={`/${nodeTypes[activeNode].image}`}
                    alt={nodeTypes[activeNode].label}
                    width={600}
                    height={300}
                    className="h-auto max-h-[320px] w-auto max-w-full rounded-lg"
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>

              {/* Accent glow */}
              <div
                className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full blur-[80px]"
                style={{
                  backgroundColor: nodeTypes[activeNode].color,
                  opacity: 0.08,
                }}
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Subtasks feature */}
        <AnimatedSection delay={0.2}>
          <div className="mt-12 group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 transition hover:border-slate-600 sm:p-8">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                    Subtasks
                  </p>
                </div>
                <h3 className="mt-3 text-2xl font-bold">
                  Check off as you build
                </h3>
                <p className="mt-3 max-w-md text-slate-300">
                  Break any node into subtasks and check them off as you go.
                  See at a glance what&apos;s done and what&apos;s left across
                  your entire project.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900 p-4">
                <Image
                  src="/gallery-tasks.png"
                  alt="Subtask checklist on a canvas node"
                  width={548}
                  height={336}
                  className="h-auto w-full max-w-xs"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE DEEP DIVES — Alternating bento
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-6xl space-y-14 px-4 py-12 sm:space-y-20 sm:px-6 sm:py-24">
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Features
            </p>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Built for how you actually work
          </h2>
        </AnimatedSection>

        {/* Full width — Canvas minimap */}
        <AnimatedSection>
          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 transition hover:border-slate-600 sm:p-8">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Navigate at scale
                </p>
                <h3 className="mt-3 text-2xl font-bold">
                  Minimap for complex projects
                </h3>
                <p className="mt-3 max-w-md text-slate-300">
                  Zoom out to see your entire architecture, or jump to any
                  section instantly. Keyboard shortcuts make demos smooth.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="overflow-hidden rounded-xl border border-slate-700/40">
                  <Image
                    src="/gallery-minimap.png"
                    alt="Mini map navigation"
                    width={374}
                    height={300}
                    className="h-auto w-32 sm:w-44"
                    unoptimized
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-700/40">
                  <Image
                    src="/gallery-minimap-lg.png"
                    alt="Zoomed mini map"
                    width={388}
                    height={282}
                    className="h-auto w-32 sm:w-44"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Import + Conversation */}
        <div className="grid gap-5 md:grid-cols-2">
          <AnimatedSection delay={0}>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 transition hover:border-slate-600">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Import anything
                </p>
              </div>
              <h3 className="mt-3 text-xl font-bold">
                Bring your existing work
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Paste a PRD, upload a doc, connect Notion, or drop in a file.
                Spexly parses it and auto-generates your canvas.
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-700/40">
                <Image
                  src="/gallery-import.png"
                  alt="Import document — drag and drop files"
                  width={1308}
                  height={762}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 transition hover:border-slate-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-400" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                  AI conversation import
                </p>
              </div>
              <h3 className="mt-3 text-xl font-bold">
                Turn chats into plans
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Drop a Claude Code transcript or paste any AI conversation.
                Spexly extracts features and architecture decisions automatically.
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-700/40">
                <Image
                  src="/gallery-conversation.png"
                  alt="Conversation import"
                  width={650}
                  height={520}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Progress tracking — full width centered */}
        <AnimatedSection delay={0}>
          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6 transition hover:border-slate-600 sm:p-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Progress tracking
              </p>
              <h3 className="mt-2 text-xl font-bold">
                See what&apos;s shipped — and what&apos;s left
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Break nodes into subtasks and check them off. Built-in stats
                show project health at a glance.
              </p>
            </div>
            <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-slate-700/40">
              <Image
                src="/gallery-stats.png"
                alt="Project stats — nodes, edges, progress, and feature status"
                width={600}
                height={1300}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <AnimatedSection>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2.5 sm:px-6 sm:py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
              </span>
              <span className="text-xs font-semibold text-cyan-200 sm:text-sm">
                Builders are already on the waitlist
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Join vibe coders who plan before they prompt. Early access invites
              go out in waves.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ — Accordion
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-24">
        <AnimatedSection>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Questions &amp; answers
          </h2>
        </AnimatedSection>

        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => (
            <AnimatedSection key={item.question} delay={i * 0.06}>
              <FaqAccordion question={item.question} answer={item.answer} />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BLOG TEASERS
      ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              From the blog
            </p>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Guides for builders
          </h2>
        </AnimatedSection>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {launchBlogPosts.map((post, i) => (
            <AnimatedSection key={post.slug} delay={i * 0.08}>
              <article className="group flex h-full flex-col rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 transition hover:border-slate-600 hover:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {post.publishedAt}
                </p>
                <h3 className="mt-2 text-lg font-bold leading-snug text-slate-100 group-hover:text-cyan-200 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  Read more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════ */}
      <section
        id="waitlist"
        className="relative z-10 mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20"
      >
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-8 sm:p-12">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[60px]" />

            <div className="relative">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                Ready to plan your next build?
              </h2>
              <p className="mt-3 max-w-lg text-base text-slate-300 sm:text-lg">
                Join now for launch updates, weekly planning tips, and
                first-wave beta invites.
              </p>
              <div className="mt-8">
                <Suspense
                  fallback={
                    <div className="h-64 animate-pulse rounded-2xl bg-slate-800" />
                  }
                >
                  <WaitlistForm />
                </Suspense>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-slate-800 px-4 py-8 text-sm text-slate-300 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/spexly-logo-white.png"
              alt="Spexly"
              width={100}
              height={40}
              className="h-auto w-24"
            />
            <span className="text-slate-500">
              Plan your app visually before you build.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/waitlist" className="transition hover:text-white">
              Waitlist
            </Link>
            <Link href="/blog" className="transition hover:text-white">
              Blog
            </Link>
            <a
              href="https://x.com/spexlyapp"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
              aria-label="Follow Spexly on X"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
