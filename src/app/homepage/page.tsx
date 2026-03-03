import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import HomepageInteractive from './components/HomepageInteractive';
import AnimatedLoader from '@/components/ui/AnimatedLoader';

import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Use Admin Client to bypass RLS for public homepage (since RLS might be broken for Anon)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Only fetch active properties for public homepage
  const { data: properties, error } = await adminSupabase
    .from('properties')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching properties:', error);
    // Handle the error appropriately
  }


  return (
    <main className="min-h-screen bg-[#080808]">
      <Suspense fallback={<AnimatedLoader fullScreen text="Loading Experience..." />}>
        <HomepageInteractive initialProperties={properties || []} />
      </Suspense>
    </main>
  );
}
