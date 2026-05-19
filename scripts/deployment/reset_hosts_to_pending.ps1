# PowerShell script to reset 'active' hosts to 'pending'
# This ensures strict enforcement of the new 'approved' status logic

$env:PGPASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q"

# Supabase connection details
$dbHost = "aws-0-ap-south-1.pooler.supabase.com"
$port = "6543"
$database = "postgres"
$user = "postgres.dlislsrlwovcxsuqdlvy"

# SQL to execute
$sql = @"
-- Update all 'active' hosts to 'pending'
UPDATE public.users
SET status = 'pending'
WHERE role = 'host' AND status = 'active';

-- Optional: Verify the count
SELECT count(*) as pending_hosts FROM public.users WHERE role = 'host' AND status = 'pending';
"@

# Execute using psql
Write-Host "Resetting 'active' hosts to 'pending'..."
Write-Host "Host: $dbHost"
Write-Host ""

# Try to execute the SQL
try {
    $sql | psql -h $dbHost -p $port -U $user -d $database
    Write-Host ""
    Write-Host "SQL executed successfully!" -ForegroundColor Green
    Write-Host "All active hosts are now pending approval." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
}
