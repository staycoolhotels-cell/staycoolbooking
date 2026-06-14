const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';
  
  const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: serviceRoleKey,
    ssl: { rejectUnauthorized: false }
  };

  const client = new Client(config);
  try {
    console.log('Connecting to Supabase Database...');
    await client.connect();
    
    console.log('Creating newsletter_subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Enable RLS
      ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

      -- Reload PostgREST schema cache
      NOTIFY pgrst, 'reload schema';
    `);

    console.log('✅ newsletter_subscriptions table created successfully!');
    await client.end();
  } catch (err) {
    console.error('❌ Error executing database migration:', err);
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
}

main();
