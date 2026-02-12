import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EmailVerificationGate } from "@/components/auth/EmailVerificationGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://spexly.com'),
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EmailVerificationGate>
          {children}
        </EmailVerificationGate>
      </body>
    </html>
  );
}
