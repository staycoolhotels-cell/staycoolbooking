const { Pool } = require('pg');

const pool = new Pool({
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    let client;
    try {
        console.log('Connecting to database directly...');
        client = await pool.connect();
        
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('Columns in transactions table:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

check();
