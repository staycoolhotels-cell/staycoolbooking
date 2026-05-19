
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNullTiers() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, tier, location')
    .eq('status', 'active');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const nullTiers = data.filter(p => !p.tier);
  console.log('Active Properties with Null Tier:', nullTiers.length);
  if (nullTiers.length > 0) {
    console.log('First 5 null tier properties:', nullTiers.slice(0, 5));
  }
}

checkNullTiers();
