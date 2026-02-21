import type { Metadata } from "next";
import "./globals.css";
import { EmailVerificationGate } from "@/components/auth/EmailVerificationGate";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://spexlyapp.com'),
  title: {
    default: 'Spexly — Visual Project Planner for Vibe Coding',
    template: '%s | Spexly',
  },
  description:
    'Stop burning AI credits on bad prompts. Spexly is a visual planning workspace for vibe coders — map features, screens, and prompts before you build in Cursor, Bolt, or Claude.',
  keywords: [
    'vibe coding planner',
    'plan vibe coding project',
    'Bolt',
    'Cursor',
    'Claude',
    'visual project management',
    'AI coding planner',
    'vibe coding',
    'app planning tool',
    'prompt planning',
    'vibecoding',
  ],
  openGraph: {
    title: 'Spexly — Visual Project Planner for Vibe Coding',
    description:
      'Stop burning AI credits on bad prompts. Map features, screens, and prompts visually before you build in Cursor, Bolt, or Claude.',
    url: '/',
    siteName: 'Spexly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spexly — Visual Project Planner for Vibe Coding',
    description:
      'Stop burning AI credits on bad prompts. Map features, screens, and prompts visually before you build in Cursor, Bolt, or Claude.',
    site: '@novae1532',
    creator: '@novae1532',
  },
  icons: {
    icon: '/spexly-logo.png',
    apple: '/spexly-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <EmailVerificationGate>
          {children}
        </EmailVerificationGate>
        <ToastContainer />
        <Analytics />
      </body>
    </html>
  );
}
