import React from 'react';
import '../styles/index.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import Header from '../components/common/Header'; // Import the Header component
import PageWrapper from '../components/common/PageWrapper'; // Import the new PageWrapper component
import { Toaster } from 'sonner';
import ErrorBoundary from '../components/ErrorBoundary';

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
  description: 'StayCool Bookings offers premium stays, unique hotels, and luxury villas worldwide. Experience cool, affordable travel and seamless hotel bookings with StayCool.',
  keywords: [
    'staycool',
    'stay',
    'cool',
    'bookings',
    'staycoolbookings',
    'hotels',
    'stays',
    'hotel booking', 
    'vacation rentals', 
    'luxury villas', 
    'nature lodges', 
    'boutique hotels', 
    'travel accommodation', 
    'staycool booking',
    'best hotels',
    'unique stays',
    'villa bookings',
    'nature retreats',
    'boutique stays',
    'resort bookings',
    'mountain lodges',
    'weekend getaways',
    'travel deals',
    'cool apartments',
    'family vacation stays',
    'affordable villas',
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
    alternateName: ['StayCool', 'Stay Cool Booking', 'StayCool Bookings', 'Stay Cool Bookings', 'StayCool Stay', 'StayCool Hotels'],
    url: 'https://staycoolbooking.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://staycoolbooking.com/homepage?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StayCool Bookings',
    alternateName: 'StayCool',
    url: 'https://staycoolbooking.com',
    logo: 'https://staycoolbooking.com/assets/images/logo.png',
    sameAs: [
      'https://twitter.com/staycoolbooking',
      'https://github.com/vsharesoftwaresolutions/staycoolbooking'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-7382118810',
      contactType: 'customer service',
    },
  };

  return (
    <html suppressHydrationWarning lang="en" className={`${lora.variable} ${montserrat.variable} scroll-smooth`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var handler = function(event) {
                  var msg = event.message || (event.reason && (event.reason.message || String(event.reason))) || '';
                  if (msg && msg.indexOf('message channel closed before a response was received') !== -1) {
                    event.preventDefault();
                    if (event.stopPropagation) event.stopPropagation();
                  }
                };
                window.addEventListener('unhandledrejection', handler, true);
                window.addEventListener('error', handler, true);
              })();
            `
          }}
        />
        <link rel="icon" href="/assets/images/logo-round.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/assets/images/logo-round.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>

      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground font-sans"
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <div className="flex flex-col min-h-screen">
            <Header /> {/* Render the Header component without isScrolled prop */}
            <ErrorBoundary>
              <PageWrapper>
                {children}
              </PageWrapper>
            </ErrorBoundary>
          </div>
        </AppRouterCacheProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
