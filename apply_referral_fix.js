const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
};

async function applyReferralFix() {
    const client = new Client(config);
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        const sqlPath = path.join(__dirname, 'src', 'lib', 'sql', 'UPDATE_REFERRAL_COMMISSION.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying SQL migration...');
        await client.query(sql);
        console.log('SUCCESS: Referral commission system updated!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Schema reload notified.');

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

applyReferralFix();
