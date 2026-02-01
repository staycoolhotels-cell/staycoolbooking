import React from 'react';
import '../styles/index.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import Header from '../components/common/Header'; // Import the Header component

import { Lora, Montserrat } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'StayCool | Secure Booking & Hosting',
  description: 'The ultimate platform for unique stays, hotel rooms, and nature lodges.',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
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
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-gradient-to-br from-gradient-background-from to-gradient-background-to text-foreground font-sans"
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <div className="flex flex-col min-h-screen">
            <Header /> {/* Render the Header component without isScrolled prop */}
            <div className="flex-grow">{children}</div>
          </div>
        </AppRouterCacheProvider>

        <script
          type="module"
          async
          src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fstaycoolb6991back.builtwithrocket.new&_be=https%3A%2F%2Fapplication.rocket.new&_v=0.1.12"
        ></script>
      </body>
    </html>
  );
}
