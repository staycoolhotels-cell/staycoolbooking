const fs = require('fs');

try {
    const content = fs.readFileSync('backup.sql', 'utf8');
    const lines = content.split('\n');
    const funcLines = lines.filter(l => 
        l.includes('CREATE FUNCTION') || l.includes('CREATE OR REPLACE FUNCTION')
    );
    console.log('All functions in backup.sql:');
    funcLines.forEach(l => console.log(l));
} catch (e) {
    console.error('Failed:', e.message);
}
