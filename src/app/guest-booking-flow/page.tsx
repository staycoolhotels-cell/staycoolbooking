import type { Metadata } from 'next';

import GuestBookingInteractive from './components/GuestBookingInteractive';

export const metadata: Metadata = {
  title: 'Book Your Stay - StayCool',
  description:
    'Discover and book unique accommodations with StayCool. Search properties, verify your identity, and complete secure payments for your perfect stay in just 3 simple steps.',
};

export default function GuestBookingFlowPage() {
  return (
    <main className="min-h-screen">
      <GuestBookingInteractive />
    </main>
  );
}
