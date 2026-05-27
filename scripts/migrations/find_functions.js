const fs = require('fs');

try {
    const content = fs.readFileSync('backup.sql', 'utf8');
    const lines = content.split('\n');
    const funcLines = lines.filter(l => 
        (l.includes('FUNCTION') || l.includes('function')) && 
        (l.toLowerCase().includes('sql') || l.toLowerCase().includes('exec') || l.toLowerCase().includes('query') || l.toLowerCase().includes('run'))
    );
    console.log('SQL/Exec/Query matches:', funcLines);
} catch (e) {
    console.error('Failed:', e.message);
}
