const { Pool } = require('pg');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'dlislsrlwovcxsuqdlvy',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
    let client;
    try {
        client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_wallets' 
            AND table_schema = 'public';
        `);
        console.log('Columns in user_wallets:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

checkStructure();
