const { Client } = require('pg');

const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres`;
const config = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
}

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'properties' AND column_name LIKE 'room_type%'
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
