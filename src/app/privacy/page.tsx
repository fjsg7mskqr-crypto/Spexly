import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for the Spexly waitlist and product.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-slate-200">
      <h1 className="text-3xl font-semibold text-slate-50">Privacy Policy</h1>
      <p className="mt-6">
        Spexly collects only the information required to operate the waitlist and product experience.
        We use your email to send confirmation and launch-related updates.
      </p>
      <p className="mt-4">
        We do not sell personal information. You can unsubscribe from emails at any time.
      </p>
    </main>
  );
}
