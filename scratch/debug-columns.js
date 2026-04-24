import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {

  try {
    const { data, error } = await supabase.from('transactions').select('*').limit(1);
    if (error) {
      console.log('Error Selecting:', error);
    } else {
      console.log('Sample Row:', data);
    }


    const { error: insertError } = await supabase.from('transactions').insert({ non_existent_column: 'test' });
    console.log('Insert Error Details:', insertError);
  } catch (err) {
    console.error('Caught Err:', err);
  }
}

check();
