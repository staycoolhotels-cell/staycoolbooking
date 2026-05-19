
const https = require('https');

const PROJECT_REF = 'dlislsrlwovcxsuqdlvy';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const SQL = `ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS board TEXT DEFAULT NULL;`;

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    console.log('Step 1: Attempting ALTER TABLE via Supabase REST (pg function)...\n');
    const pgBody = JSON.stringify({ query: SQL });
    const r1 = await request({
        hostname: `${PROJECT_REF}.supabase.co`,
        path: '/rest/v1/rpc/pg_query',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Length': Buffer.byteLength(pgBody),
        }
    }, pgBody);
    console.log('pg_query status:', r1.status, r1.body);
    console.log('\nStep 2: Checking current wishlist columns...');
    const r2 = await request({
        hostname: `${PROJECT_REF}.supabase.co`,
        path: '/rest/v1/wishlist?limit=1',
        method: 'GET',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Accept': 'application/json',
        }
    }, null);
    console.log('Wishlist sample row:', r2.body);

    if (r2.body && r2.body.includes('"board"')) {
        console.log('\n✅ Board column ALREADY EXISTS in wishlist table!');
    } else {
        console.log('\n⚠️  Board column NOT found yet.');
        console.log('\n=== Please run this SQL in Supabase Dashboard > SQL Editor ===');
        console.log(SQL);
        console.log('=============================================================\n');
    }
}

main().catch(console.error);
