const { Client } = require('pg');
const dns = require('dns').promises;

const configTemplate = {
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
};

async function checkStats() {
    let ipv4Address;
    try {
        console.log('Resolving host db.dlislsrlwovcxsuqdlvy.supabase.co to IPv4...');
        const addresses = await dns.resolve4('db.dlislsrlwovcxsuqdlvy.supabase.co');
        if (addresses && addresses.length > 0) {
            ipv4Address = addresses[0];
            console.log(`Resolved to IPv4: ${ipv4Address}`);
        } else {
            throw new Error('No IPv4 addresses returned.');
        }
    } catch (dnsErr) {
        console.error('DNS lookup failed for IPv4:', dnsErr.message);
        console.log('Falling back to literal host domain...');
        ipv4Address = 'db.dlislsrlwovcxsuqdlvy.supabase.co';
    }

    const configDirect = { ...configTemplate, host: ipv4Address, port: 5432 };
    const configPooler = { ...configTemplate, host: ipv4Address, port: 6543 };

    let client = new Client(configDirect);
    try {
        console.log(`Trying direct connection on port 5432 with host ${ipv4Address}...`);
        await client.connect();
        console.log('SUCCESS: Connected on port 5432!');
    } catch (errDirect) {
        console.warn('Direct connection failed on port 5432:', errDirect.message);
        console.log(`Trying pooler connection on port 6543 with host ${ipv4Address}...`);
        client = new Client(configPooler);
        try {
            await client.connect();
            console.log('SUCCESS: Connected on port 6543!');
        } catch (errPooler) {
            console.error('Pooler connection failed on port 6543:', errPooler.message);
            return;
        }
    }

    try {
        // Get all tables in public schema
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('\n--- PUBLIC SCHEMA TABLES AND ROW COUNTS ---');
        for (const row of resTables.rows) {
            const tableName = row.table_name;
            try {
                const countRes = await client.query(`SELECT COUNT(*) FROM public."${tableName}"`);
                const count = countRes.rows[0].count;
                console.log(`- ${tableName}: ${count} rows`);
            } catch (err) {
                console.log(`- ${tableName}: Error counting rows (${err.message})`);
            }
        }

        // Get auth users count and details
        console.log('\n--- AUTH USERS ---');
        try {
            const authUsersRes = await client.query(`
                SELECT id, email, created_at, raw_user_meta_data->>'role' as role
                FROM auth.users
                ORDER BY created_at DESC;
            `);
            console.log(`Total users in auth.users: ${authUsersRes.rows.length}`);
            authUsersRes.rows.forEach(user => {
                console.log(`- ${user.email} (ID: ${user.id}, Role: ${user.role || 'N/A'}, Created: ${user.created_at})`);
            });
        } catch (err) {
            console.log(`Error reading auth.users: ${err.message}`);
        }

    } catch (err) {
        console.error('Error executing queries:', err.message);
    } finally {
        await client.end();
    }
}

checkStats();
