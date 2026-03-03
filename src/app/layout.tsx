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

export const metadata = {
  title: 'StayCool Booking',
  description: 'The ultimate platform for unique stays, hotel rooms, and nature lodges.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${lora.variable} ${montserrat.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
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
