
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Credentials from apply_bookings_rls.ps1
const config = {
    host: "aws-0-ap-south-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: "postgres.dlislsrlwovcxsuqdlvy",
    password: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q",
    ssl: { rejectUnauthorized: false }
};

async function applySql() {
    console.log('Connecting to database...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        const sql = fs.readFileSync(path.join(__dirname, 'fix_check_availability.sql'), 'utf8');
        console.log('Executing SQL...');

        await client.query(sql);
        console.log('SQL executed successfully!');

        // Notify PostgREST to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
