import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradejournal.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Trade Journal — Professional Trading Journal & Performance Tracker',
    template: '%s | Trade Journal',
  },
  description:
    'The #1 professional trading journal app. Log trades, track performance, and analyze win rates for stocks, forex, crypto, options & funded accounts. Start free today.',
  keywords: [
    'trading journal',
    'trade journal app',
    'trading log',
    'trade tracker',
    'trading performance tracker',
    'stock trading journal',
    'forex trading journal',
    'crypto trading journal',
    'options trading journal',
    'day trading journal',
    'swing trading journal',
    'funded account journal',
    'FTMO journal',
    'trading analytics',
    'trade diary',
    'trading diary',
    'best trading journal',
    'online trading journal',
    'trade log software',
    'trading performance analysis',
    'win rate tracker',
    'profit loss tracker',
    'risk management trading',
    'trading discipline',
    'trade entry log',
  ],
  authors: [{ name: 'Trade Journal' }],
  creator: 'Trade Journal',
  publisher: 'Trade Journal',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Trade Journal',
    title: 'Trade Journal — Professional Trading Journal & Performance Tracker',
    description:
      'Log every trade, analyze your performance, and improve your win rate. Works for stocks, forex, crypto, options & funded accounts.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Trade Journal — Professional Trading Journal App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trade Journal — Professional Trading Journal',
    description:
      'Track trades, analyze performance, and improve your win rate. Free professional trading journal for all markets.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@tradejournal',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'finance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="theme-color" content="#0a0e14" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111822',
              color: '#c9d1d9',
              border: '1px solid #1e2936',
            },
            success: {
              iconTheme: { primary: '#00ff88', secondary: '#111822' },
            },
            error: {
              iconTheme: { primary: '#ff4757', secondary: '#111822' },
            },
          }}
        />
      </body>
    </html>
  );
}
