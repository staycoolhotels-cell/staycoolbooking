const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const userId = '22cf712b-b514-42b3-be30-a46a1bb9cc62';
  console.log(`Updating Auth user metadata for user ID: ${userId}...`);

  // 1. Fetch current auth user to preserve other metadata
  const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
  if (fetchError || !user) {
    console.error('Failed to fetch auth user:', fetchError);
    process.exit(1);
  }

  console.log('Current user metadata:', user.user_metadata);

  // 2. Perform the update
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...user.user_metadata,
      role: 'host',
      status: 'active'
    }
  });

  if (updateError) {
    console.error('Error updating user metadata:', updateError);
  } else {
    console.log('Success! New user metadata:', updatedUser.user.user_metadata);
  }
}

main();
