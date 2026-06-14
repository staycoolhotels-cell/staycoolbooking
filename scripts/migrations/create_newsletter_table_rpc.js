const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function main() {
  const sqlString = `
    CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Enable RLS
    ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

    -- Grant service role full access
    GRANT ALL ON public.newsletter_subscriptions TO service_role;
  `;

  console.log('Sending SQL migration via Supabase RPC exec_sql...');
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sqlString });

    if (error) {
      console.error('❌ Supabase RPC Error:', error);
      // Try alternative parameter name if schema uses a different name
      console.log('Retrying with alternative parameter "query"...');
      const { data: data2, error: error2 } = await supabaseAdmin.rpc('exec_sql', { query: sqlString });
      
      if (error2) {
        throw error2;
      }
      console.log('✅ newsletter_subscriptions table created successfully (via alternative param)!');
    } else {
      console.log('✅ newsletter_subscriptions table created successfully!');
    }
  } catch (err) {
    console.error('❌ Failed to run migration via RPC:', err.message || err);
    process.exit(1);
  }
}

main();
