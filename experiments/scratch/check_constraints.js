const { Client } = require('pg');
const client = new Client({
    connectionString: "postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});
async function checkConstraints() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT conname, contype, conkey
            FROM pg_constraint
            WHERE conrelid = 'public.payment_transfers'::regclass;
        `);
        console.table(res.rows);
        
        const indexRes = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'payment_transfers';
        `);
        console.table(indexRes.rows);

        await client.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}
checkConstraints();
