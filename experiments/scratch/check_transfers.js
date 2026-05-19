const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});
async function checkData() {
    try {
        await client.connect();
        console.log('--- Payment Transfers ---');
        const res = await client.query('SELECT * FROM payment_transfers LIMIT 5');
        console.table(res.rows);
        
        console.log('--- Table Count ---');
        const countRes = await client.query('SELECT COUNT(*) FROM payment_transfers');
        console.log('Total transfers:', countRes.rows[0].count);

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}
checkData();
