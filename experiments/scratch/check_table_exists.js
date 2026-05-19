const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});
async function checkTable() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT EXISTS (
               SELECT FROM information_schema.tables 
               WHERE  table_schema = 'public'
               AND    table_name   = 'payment_transfers'
            );
        `);
        console.log('Table payment_transfers exists:', res.rows[0].exists);
        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}
checkTable();
