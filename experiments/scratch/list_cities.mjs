
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listCities() {
  const { data, error } = await supabase
    .from('properties')
    .select('location');

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  const cities = new Set();
  data.forEach(p => {
    if (p.location) {
      const city = p.location.split(',')[0].trim();
      cities.add(city);
    }
  });

  console.log('Found cities:', Array.from(cities));
}

listCities();
