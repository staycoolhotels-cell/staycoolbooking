import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const createBucket = async (bucketName: string) => {
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (error) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
    });
  }
};

createBucket('images');
createBucket('documents');