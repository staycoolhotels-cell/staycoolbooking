import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Columns in ${tableName} table:`, Object.keys(data[0]));
  } else {
    console.log(`${tableName} table is empty.`);
  }
}

async function run() {
  await checkColumns('properties');
  await checkColumns('bookings');
  await checkColumns('transactions');
  await checkColumns('payment_transfers');
}

run();
