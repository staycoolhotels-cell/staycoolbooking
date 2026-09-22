const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.dlislsrlwovcxsuqdlvy:2bFZKr8g15GBpfng@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function enableRealtime() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL!');

    try {
      await client.query('ALTER TABLE public.notifications REPLICA IDENTITY FULL;');
      console.log('✅ REPLICA IDENTITY FULL set on public.notifications');
    } catch (e) {
      console.log('Replica note:', e.message);
    }

    try {
      await client.query('ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;');
      console.log('✅ public.notifications ADDED to supabase_realtime publication!');
    } catch (e) {
      console.log('Publication note:', e.message);
    }

    const { rows } = await client.query("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'");
    console.log('Current tables in supabase_realtime:', rows.map(r => r.tablename));

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✅ Reloaded schema');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

enableRealtime();
