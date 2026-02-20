import type { Metadata } from "next";
import "./globals.css";
import { EmailVerificationGate } from "@/components/auth/EmailVerificationGate";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://spexlyapp.com'),
  title: {
    default: 'Spexly',
    template: '%s | Spexly',
  },
  description: 'Plan your app visually. Build with clarity.',
  openGraph: {
    title: 'Spexly',
    description: 'Plan your app visually. Build with clarity.',
    url: '/',
    siteName: 'Spexly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spexly',
    description: 'Plan your app visually. Build with clarity.',
  },
  icons: {
    icon: "/spexly-logo.png",
    apple: "/spexly-logo.png",
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
      </body>
    </html>
  );
}
