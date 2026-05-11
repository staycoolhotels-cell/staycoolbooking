
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAPPINGS = {
  'కడప': 'Kadapa',
  'ఫిరంగిపురం': 'Phirangipuram',
  'మంగళగిరి': 'Mangalagiri',
  'పామూరు': 'Pamuru',
  'గుంటూరు': 'Guntur'
};

async function updateTeluguToEnglish() {
  const { data, error } = await supabase
    .from('properties')
    .select('*');

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  for (const property of data) {
    let needsUpdate = false;
    const updates = {};

    // Check city
    if (property.city && MAPPINGS[property.city]) {
      updates.city = MAPPINGS[property.city];
      needsUpdate = true;
    }

    // Check district
    if (property.district && MAPPINGS[property.district]) {
      updates.district = MAPPINGS[property.district];
      needsUpdate = true;
    }

    // Check location
    if (property.location) {
      let newLocation = property.location;
      let locNeedsUpdate = false;
      Object.entries(MAPPINGS).forEach(([telugu, english]) => {
        if (newLocation.includes(telugu)) {
          newLocation = newLocation.replace(telugu, english);
          locNeedsUpdate = true;
        }
      });
      if (locNeedsUpdate) {
        updates.location = newLocation;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(`Updating property ${property.id}:`, updates);
      const { error: updateError } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', property.id);
      
      if (updateError) {
        console.error(`Error updating property ${property.id}:`, updateError);
      }
    }
  }

  console.log('Update complete.');
}

updateTeluguToEnglish();
