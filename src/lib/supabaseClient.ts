import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

const createBucket = async (bucketName: string) => {
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (error) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
    });
  }
};

// Removed top-level bucket creation to prevent 400 errors in browser with anon key.
// createBucket('images');
// createBucket('documents');
// createBucket('avatars');