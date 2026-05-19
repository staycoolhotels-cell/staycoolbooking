const { Client } = require('pg');
const fs = require('fs');

async function apply() {
    const uri = 'postgresql://postgres.dlislsrlwovcxsuqdlvy:2bFZKr8g15GBpfng@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
    const client = new Client({ 
        connectionString: uri,
        ssl: { rejectUnauthorized: false }
    });
    try {
        console.log('Connecting with URI...');
        await client.connect();
        console.log('Connected. Running FIX...');
        
        const sql1 = fs.readFileSync('FIX_MISSING_COLUMNS.sql', 'utf8');
        await client.query(sql1);
        console.log('FIX_MISSING_COLUMNS applied.');
        
        const sql2 = fs.readFileSync('UPDATE_CREATE_PROPERTY_FUNCTION.sql', 'utf8');
        await client.query(sql2);
        console.log('UPDATE_CREATE_PROPERTY_FUNCTION applied.');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
apply();
