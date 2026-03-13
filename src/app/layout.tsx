import React from 'react';
import '../styles/index.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import Header from '../components/common/Header'; // Import the Header component
import PageWrapper from '../components/common/PageWrapper'; // Import the new PageWrapper component
import { Toaster } from 'sonner';

import { Lora, Montserrat } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | StayCool Booking',
    default: 'StayCool Booking - Find Your Perfect Stay',
  },
  description: 'The ultimate platform for unique stays, hotel rooms, and nature lodges. Book your next adventure with StayCool Booking.',
  keywords: ['hotel booking', 'vacation rentals', 'nature lodges', 'unique stays', 'travel', 'accommodation', 'staycool'],
  authors: [{ name: 'StayCool Booking' }],
  creator: 'StayCool Booking',
  publisher: 'StayCool Booking',
  metadataBase: new URL('https://staycoolbooking.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'StayCool Booking - Find Your Perfect Stay',
    description: 'The ultimate platform for unique stays, hotel rooms, and nature lodges.',
    url: 'https://staycoolbooking.com',
    siteName: 'StayCool Booking',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'StayCool Booking Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StayCool Booking - Find Your Perfect Stay',
    description: 'The ultimate platform for unique stays, hotel rooms, and nature lodges.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${lora.variable} ${montserrat.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground font-sans"
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <div className="flex flex-col min-h-screen">
            <Header /> {/* Render the Header component without isScrolled prop */}
            <PageWrapper>
              {children}
            </PageWrapper>
          </div>
        </AppRouterCacheProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
