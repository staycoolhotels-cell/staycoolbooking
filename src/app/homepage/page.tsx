import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import HomepageInteractive from './components/HomepageInteractive';


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

  const { data: properties, error } = await supabase.from('properties').select('*');

  if (error) {
    console.error('Error fetching properties:', error);
    // Handle the error appropriately
  }

  return (
    <main className="min-h-screen bg-background">
      
      <HomepageInteractive initialProperties={properties || []} />
    </main>
  );
}
