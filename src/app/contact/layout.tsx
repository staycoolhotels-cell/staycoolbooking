import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact StayCool Bookings',
  description: 'Get in touch with StayCool Bookings for support, inquiries, or feedback. We are here to help.',
  keywords: ['contact staycool', 'staycool support', 'staycool help', 'customer service', 'staycool bookings phone'],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
