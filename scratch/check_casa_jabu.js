const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = (serviceKeyMatch ? serviceKeyMatch[1].trim() : '') || (keyMatch ? keyMatch[1].trim() : '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, tier, price_per_night, weekend_price_per_night, room_types, room_type_prices, room_type_weekend_prices, room_type_counts')
    .ilike('title', '%Casa jabu%');

  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Results:', JSON.stringify(data, null, 2));
}

check();
