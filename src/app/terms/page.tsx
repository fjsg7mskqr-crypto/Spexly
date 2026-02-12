import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Terms for using the Spexly site and waitlist.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-slate-200">
      <h1 className="text-3xl font-semibold text-slate-50">Terms</h1>
      <p className="mt-6">
        By using Spexly and joining the waitlist, you agree to receive product communications related to
        launch access and onboarding.
      </p>
      <p className="mt-4">
        Spexly is provided as-is during pre-launch. Features and timelines may change while we prepare
        for beta.
      </p>
    </main>
  );
}
