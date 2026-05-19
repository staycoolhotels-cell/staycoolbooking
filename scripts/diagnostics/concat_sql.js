const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const filesToConcat = [
    '20260219_bulk_booking_schema.sql',
    '20260219_bulk_booking_functions.sql',
    '20260220_host_system_schema.sql',
    '20260220_host_system_functions.sql',
    '20260220_update_property_functions_bulk.sql',
    '20260220_add_room_type.sql',
    '20260221_fix_create_bulk_booking.sql'
];

let allSql = '-- ==========================================\n';
allSql += '-- COMPREHENSIVE FIX FOR MISSING SCHEMA\n';
allSql += '-- Please run this entire script in your Supabase SQL Editor\n';
allSql += '-- ==========================================\n\n';

for (const file of filesToConcat) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
        allSql += `-- === FROM ${file} ===\n`;
        allSql += fs.readFileSync(filePath, 'utf8') + '\n\n';
    } else {
        console.error(`Missing file: ${file}`);
    }
}

fs.writeFileSync(path.join(__dirname, 'SUPABASE_APPLY_ME.sql'), allSql);
console.log('Created SUPABASE_APPLY_ME.sql');
