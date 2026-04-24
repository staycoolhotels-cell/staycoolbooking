import AnimatedLoader from '@/components/ui/AnimatedLoader';
import { getActiveProperties } from '@/lib/data-service';
import { Suspense } from 'react';
import HomepageInteractive from './components/HomepageInteractive';

export const revalidate = 0; // Force dynamic to ensure immediate updates after cache invalidation

export default async function Homepage() {
  // Fetch cached properties
  const properties = await getActiveProperties();

  if (!properties) {
    console.warn('No active properties found');
  }


  return (
    <main className="min-h-screen bg-[#080808]">
      <Suspense fallback={<AnimatedLoader fullScreen text="Loading Experience..." />}>
        <HomepageInteractive initialProperties={properties || []} />
      </Suspense>
    </main>
  );
}
