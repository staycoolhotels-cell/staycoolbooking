import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About StayCool Bookings',
  description: 'Learn more about StayCool Bookings, our mission to transform hospitality, and the professional team behind the platform.',
  keywords: ['about staycool', 'staycool story', 'staycool team', 'staycool bookings mission', 'travel platform'],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
