const { Client } = require('pg');
const regions = ['ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'eu-central-1', 'eu-west-1', 'us-east-1', 'us-west-1'];

async function test() {
  for (const r of regions) {
    for (const p of [0, 1]) {
      const host = 'aws-' + p + '-' + r + '.pooler.supabase.com';
      const client = new Client({
        host,
        port: 6543,
        database: 'postgres',
        user: 'postgres.dlislsrlwovcxsuqdlvy',
        password: '2bFZKr8g15GBpfng',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
      });
      try {
        await client.connect();
        console.log('SUCCESS on host:', host);
        await client.query("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS room_type_specs JSONB DEFAULT '{}'::JSONB; NOTIFY pgrst, 'reload schema';");
        console.log('COLUMN ADDED SUCCESSFULLY ON', host);
        await client.end();
        return;
      } catch(e) {
        console.log(host, '->', e.message);
        try { await client.end(); } catch(err){}
      }
    }
  }
}
test();
