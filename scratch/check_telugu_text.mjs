
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTelugu() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, description');

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  const teluguProps = data.filter(p => 
    /[\u0C00-\u0C7F]/.test(p.title || '') || 
    /[\u0C00-\u0C7F]/.test(p.description || '')
  );
  console.log('Telugu Titles/Descriptions:', teluguProps);
}

checkTelugu();
