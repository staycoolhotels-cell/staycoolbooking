
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPhirangipuram() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('location', '%Phirangipuram%');

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  console.log('Phirangipuram Properties:', data);
}

checkPhirangipuram();
