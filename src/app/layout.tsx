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
  themeColor: '#0ea5e9',
};

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | StayCool Booking',
    default: 'StayCool Booking - Premium Stays, Villas & Nature Lodges',
  },
  description: 'Book unique stays including boutique hotels, luxury villas, and nature lodges. Experience unforgettable travel with StayCool Booking.',
  keywords: [
    'hotel booking', 
    'vacation rentals', 
    'luxury villas', 
    'nature lodges', 
    'boutique hotels', 
    'travel accommodation', 
    'staycool booking',
    'unique stays',
    'homestays'
  ],
  authors: [{ name: 'StayCool Booking Team' }],
  creator: 'StayCool Booking',
  publisher: 'StayCool Booking Inc.',
  metadataBase: new URL('https://staycoolbooking.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'StayCool Booking - Find Your Perfect Unique Stay',
    description: 'The ultimate platform for unique stays, luxury villas, and nature lodges worldwide.',
    url: 'https://staycoolbooking.com',
    siteName: 'StayCool Booking',
    images: [
      {
        url: '/assets/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'StayCool Booking - Premium Stays',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StayCool Booking - Premium Stays & Villas',
    description: 'Book unique stays and nature lodges worldwide with StayCool Booking.',
    images: ['/assets/images/logo.png'],
    creator: '@staycoolbooking',
  },
  icons: {
    icon: [
      { url: '/assets/images/logo-round.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/assets/images/logo-round.png',
    apple: [
      { url: '/assets/images/logo-round.png', type: 'image/png', sizes: '512x512' },
    ],
  },
  appleWebApp: {
    title: 'StayCool',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StayCool Booking',
    alternateName: ['StayCool', 'Stay Cool Booking'],
    url: 'https://staycoolbooking.com',
  };

  return (
    <html suppressHydrationWarning lang="en" className={`${lora.variable} ${montserrat.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/assets/images/logo-round.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/assets/images/logo-round.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
