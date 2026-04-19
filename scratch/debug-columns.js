import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // If we can't use raw SQL, we can try to find an RPC that does it or try to insert and catch error
  try {
     const { data, error } = await supabase.from('transactions').select('*').limit(1);
     if (error) {
       console.log('Error Selecting:', error);
     } else {
       console.log('Sample Row:', data);
     }
     
     // Try to insert a row with an obviously wrong column name to get the list of valid columns
     const { error: insertError } = await supabase.from('transactions').insert({ non_existent_column: 'test' });
     console.log('Insert Error Details:', insertError);
  } catch (err) {
    console.error('Caught Err:', err);
  }
}

check();
